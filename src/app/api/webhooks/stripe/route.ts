import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { markEventProcessed } from "@/lib/webhook-idempotency";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Idempotency check — prevent replay attacks
  if (!markEventProcessed(event.id)) {
    console.log(`Duplicate webhook event ignored: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as "pro" | "elite";

        if (userId && tier) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              is_premium: true,
              stripe_customer_id: session.customer as string,
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Map price to tier
        const priceId = subscription.items.data[0]?.price.id;
        const tier = mapPriceToTier(priceId);
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        await supabase
          .from("profiles")
          .update({
            subscription_tier: isActive ? tier : "free",
            is_premium: isActive && tier !== "free",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            is_premium: false,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_succeeded": {
        // Log successful payment — could extend for receipts
        console.log("Payment succeeded:", event.data.object.id);
        break;
      }

      case "invoice.payment_failed": {
        // Could trigger email notification to user
        console.log("Payment failed:", event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapPriceToTier(priceId: string): "free" | "pro" | "elite" {
  // Map Stripe price IDs to subscription tiers
  // TODO: Update with actual Stripe price IDs once products are created
  const priceMap: Record<string, "pro" | "elite"> = {
    // price_xxx: "pro",
    // price_yyy: "elite",
  };
  return priceMap[priceId] || "free";
}
