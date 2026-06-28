import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { markEventProcessed } from "@/lib/webhook-idempotency";
import { notifyPurchase, notifyNewSubscription, sendUserNotification } from "@/lib/email-notifications";

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

        // Handle shop purchase checkout
        if (purchaseType === "shop_purchase") {
          const orderId = session.metadata?.order_id;
          if (orderId) {
            // Update order status
            await supabase
              .from("shop_orders")
              .update({
                status: "paid",
                stripe_payment_intent_id: session.payment_intent as string,
                shipping_address: session.shipping_details?.address ?? null,
                shipping_name: session.shipping_details?.name ?? null,
              })
              .eq("id", orderId);

            // Get order items and decrement inventory
            const { data: orderItems } = await supabase
              .from("shop_order_items")
              .select("product_id, quantity")
              .eq("order_id", orderId);

            for (const item of orderItems ?? []) {
              const { data: product } = await supabase
                .from("shop_products")
                .select("inventory_count, reserved_count, sold_count")
                .eq("id", item.product_id)
                .single();

              if (product) {
                const newInventory = Math.max(0, product.inventory_count - item.quantity);
                const newReserved = Math.max(0, product.reserved_count - item.quantity);
                const newSold = product.sold_count + item.quantity;

                await supabase
                  .from("shop_products")
                  .update({
                    inventory_count: newInventory,
                    reserved_count: newReserved,
                    sold_count: newSold,
                    status: newInventory <= 0 ? "sold_out" : undefined,
                  })
                  .eq("id", item.product_id);

                // Log inventory event
                await supabase.from("shop_inventory_events").insert({
                  product_id: item.product_id,
                  event_type: "sold",
                  quantity: -item.quantity,
                  previous_inventory: product.inventory_count,
                  new_inventory: newInventory,
                  note: `Order ${orderId}`,
                });
              }
            }

            // Clear user's cart
            const shopUserId = session.metadata?.user_id;
            if (shopUserId) {
              await supabase
                .from("shop_cart_items")
                .delete()
                .eq("user_id", shopUserId);

              // Email order confirmation (fire-and-forget)
              const { data: shopBuyer } = await supabase.from("profiles").select("username, display_name, email").eq("id", shopUserId).single();
              if (shopBuyer?.email) {
                const itemNames = (orderItems ?? []).map((i: any) => `${i.quantity}x item`).join(", ");
                void sendUserNotification(
                  shopBuyer.email,
                  "Order Confirmed! \uD83D\uDCE6",
                  `<p>Hi ${shopBuyer.display_name || shopBuyer.username || "Trainer"},</p>
                   <p>Your order <strong>#${orderId?.slice(0, 8)}</strong> has been confirmed!</p>
                   <p>We'll notify you when your items ship.</p>`,
                  "https://poke-trade.com/dashboard/orders",
                  "View Order"
                );
              }
            }
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
