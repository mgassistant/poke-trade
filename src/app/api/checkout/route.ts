import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { checkRateLimit, getClientIp, rateLimitKey } from "@/lib/rate-limit";
import { checkAccountAge } from "@/lib/auth-security";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// In-memory failed checkout attempt tracker
const failedCheckoutAttempts = new Map<string, { count: number; resetAt: number }>();

function checkFailedAttempts(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = failedCheckoutAttempts.get(userId);

  if (!entry || now > entry.resetAt) {
    failedCheckoutAttempts.set(userId, { count: 0, resetAt: now + 3_600_000 }); // 1 hour window
    return { allowed: true, remaining: 3 };
  }

  if (entry.count >= 3) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: 3 - entry.count };
}

function recordFailedCheckout(userId: string) {
  const now = Date.now();
  const entry = failedCheckoutAttempts.get(userId);

  if (!entry || now > entry.resetAt) {
    failedCheckoutAttempts.set(userId, { count: 1, resetAt: now + 3_600_000 });
  } else {
    entry.count++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);

    // Rate limit: checkout tier (3/min)
    const rl = checkRateLimit(rateLimitKey(ip), "checkout");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait before trying again." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Require email verification
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email address before making a purchase." },
        { status: 403 }
      );
    }

    // Require account age > 24 hours
    const accountAge = checkAccountAge(user.created_at);
    if (!accountAge.eligible) {
      return NextResponse.json(
        {
          error: `Account must be at least ${accountAge.requiredHours} hours old before first purchase. Your account is ${accountAge.hoursOld} hours old.`,
        },
        { status: 403 }
      );
    }

    // Check failed checkout attempts
    const failedCheck = checkFailedAttempts(user.id);
    if (!failedCheck.allowed) {
      return NextResponse.json(
        { error: "Too many failed checkout attempts. Please try again in an hour." },
        { status: 429 }
      );
    }

    // Parse body
    let body: { listingId?: string; tier?: string; priceId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { listingId, tier, priceId } = body;

    // Use service client for admin-level profile access
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get or create Stripe customer
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, created_at")
      .eq("id", user.id)
      .single();

    let customerId = (profile as Record<string, unknown> | null)?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
          created_at: user.created_at,
        },
      });
      customerId = customer.id;

      await serviceClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Build checkout session params
    const accountAgeHours = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60)
    );

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${origin}/dashboard/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/marketplace?canceled=true`,
      metadata: {
        user_id: user.id,
        email: user.email!,
        ip,
        account_age_hours: String(accountAgeHours),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          email: user.email!,
          ip,
          account_age_hours: String(accountAgeHours),
        },
        // Enable Stripe Radar fraud detection
        radar_options: {
          session: user.id.replace(/-/g, "").substring(0, 32),
        },
      },
    };

    // Subscription (tier-based) checkout
    if (tier && priceId) {
      sessionParams.mode = "subscription";
      sessionParams.line_items = [{ price: priceId, quantity: 1 }];
      sessionParams.metadata.tier = tier;
      // Remove payment_intent_data for subscriptions (uses subscription_data instead)
      delete sessionParams.payment_intent_data;
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
          tier,
        },
      };
    }
    // One-time listing purchase
    else if (listingId) {
      const { data: listingData } = await serviceClient
        .from("listings")
        .select("id, title, price, status, user_id")
        .eq("id", listingId)
        .single();

      const listing = listingData as Record<string, unknown> | null;

      if (!listing) {
        recordFailedCheckout(user.id);
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }

      if (listing.status !== "active") {
        recordFailedCheckout(user.id);
        return NextResponse.json({ error: "Listing is no longer available" }, { status: 400 });
      }

      if (listing.user_id === user.id) {
        return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });
      }

      const listingPrice = Number(listing.price) || 0;
      const listingTitle = String(listing.title || `Pokémon Card Listing #${listing.id}`);
      const listingIdStr = String(listing.id);

      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listingTitle,
              metadata: { listing_id: listingIdStr },
            },
            unit_amount: Math.round(listingPrice * 100), // cents
          },
          quantity: 1,
        },
      ];
      sessionParams.metadata.listing_id = listingId;
    } else {
      return NextResponse.json(
        { error: "Either listingId or tier+priceId is required" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[checkout] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during checkout" },
      { status: 500 }
    );
  }
}
