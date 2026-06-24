import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { markEventProcessed } from "@/lib/webhook-idempotency";
import { notifyPurchase, notifyNewSubscription } from "@/lib/email-notifications";

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
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as "pro" | "elite" | undefined;
        const listingId = session.metadata?.listing_id;
        const purchaseType = session.metadata?.type;

        // Handle Drop Alerts subscription checkout
        if (purchaseType === "drop_alerts" && userId) {
          const subscriptionId = session.subscription as string;
          await supabase
            .from("profiles")
            .update({
              drop_alerts_active: true,
              drop_alerts_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
            })
            .eq("id", userId);
        }

        // Handle membership subscription checkout
        if (userId && tier && !listingId && purchaseType !== "drop_alerts") {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              is_premium: true,
              stripe_customer_id: session.customer as string,
            })
            .eq("id", userId);

          // Email notification for new subscription (fire-and-forget)
          const { data: subProf } = await supabase.from("profiles").select("username, display_name, email").eq("id", userId).single();
          if (subProf?.email) {
            notifyNewSubscription(
              subProf.display_name || subProf.username || "Member",
              subProf.email,
              tier === "elite" ? "Poké-Trade Elite" : "Poké-Trade Pro"
            );
          }
        }

        // Handle listing purchase checkout
        if (purchaseType === "listing_purchase" && listingId) {
          const buyerId = session.metadata?.buyer_id;
          const sellerId = session.metadata?.seller_id;
          const platformFeeCents = parseInt(session.metadata?.platform_fee || "0");
          const amountCents = parseInt(session.metadata?.amount || "0");

          if (buyerId && sellerId) {
            const amount = amountCents / 100;
            const platformFee = platformFeeCents / 100;
            const sellerPayout = amount - platformFee;

            // Create order
            const { data: order } = await supabase.from("orders").insert({
              listing_id: listingId,
              buyer_id: buyerId,
              seller_id: sellerId,
              amount,
              platform_fee: platformFee,
              seller_payout: sellerPayout,
              stripe_payment_intent_id: session.payment_intent as string,
              status: "paid",
            }).select().single();

            // Mark listing as sold
            await supabase
              .from("listings")
              .update({ status: "sold" })
              .eq("id", listingId);

            // Decline any pending offers on this listing
            await supabase
              .from("offers")
              .update({ status: "declined" })
              .eq("listing_id", listingId)
              .in("status", ["pending", "countered"]);

            // Get listing title for notification
            const { data: listing } = await supabase
              .from("listings")
              .select("title")
              .eq("id", listingId)
              .single();

            // Notify seller
            await supabase.from("notifications").insert({
              user_id: sellerId,
              type: "listing_sold",
              title: "Item Sold!",
              message: `Your listing "${listing?.title || "item"}" has been purchased for $${amount.toFixed(2)}. Please ship the item.`,
              data: { order_id: order?.id, listing_id: listingId },
            });

            // Notify buyer
            await supabase.from("notifications").insert({
              user_id: buyerId,
              type: "purchase_complete",
              title: "Purchase Confirmed",
              message: `Your purchase of "${listing?.title || "item"}" is confirmed. The seller has been notified to ship.`,
              data: { order_id: order?.id, listing_id: listingId },
            });

            // Email notifications (fire-and-forget)
            const { data: buyerProf } = await supabase.from("profiles").select("username, display_name, email").eq("id", buyerId).single();
            const { data: sellerProf } = await supabase.from("profiles").select("username, display_name, email").eq("id", sellerId).single();
            if (buyerProf?.email && sellerProf?.email) {
              notifyPurchase(
                buyerProf.display_name || buyerProf.username || "Buyer",
                buyerProf.email,
                sellerProf.display_name || sellerProf.username || "Seller",
                sellerProf.email,
                listing?.title || "Pokémon Card",
                amount
              );
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const priceId = subscription.items.data[0]?.price.id;
        const tier = subscription.metadata?.tier || mapPriceToTier(priceId);
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
        const subType = subscription.metadata?.type;

        if (subType === "drop_alerts") {
          // Cancel drop alerts add-on
          await supabase
            .from("profiles")
            .update({
              drop_alerts_active: false,
              drop_alerts_subscription_id: null,
            })
            .eq("stripe_customer_id", customerId);
        } else {
          // Cancel membership subscription
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              is_premium: false,
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        break;

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapPriceToTier(priceId: string): "free" | "pro" | "elite" {
  const priceMap: Record<string, "pro" | "elite"> = {
    // Will be auto-populated when products are created via /api/membership/checkout
  };
  return priceMap[priceId] || "free";
}
