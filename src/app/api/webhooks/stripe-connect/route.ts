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

  if (!sig || !process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Connect webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Idempotency check
  if (!markEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as { id: string; payouts_enabled?: boolean; details_submitted?: boolean; charges_enabled?: boolean };

        // Update profile with current Connect status
        await supabase
          .from("profiles")
          .update({
            connect_onboarded: account.details_submitted ?? false,
            connect_payouts_enabled: account.payouts_enabled ?? false,
          })
          .eq("stripe_connect_id", account.id);

        console.log(
          `[stripe-connect] account.updated: ${account.id} payouts=${account.payouts_enabled} onboarded=${account.details_submitted}`
        );
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as { id: string; amount: number; currency: string; destination?: string };
        const connectAccountId = event.account;

        if (connectAccountId) {
          await supabase.from("seller_payouts").insert({
            seller_id: await getSellerIdByConnectAccount(connectAccountId),
            stripe_payout_id: payout.id,
            amount: payout.amount / 100,
            currency: payout.currency,
            status: "paid",
          });
        }

        console.log(`[stripe-connect] payout.paid: ${payout.id} amount=${payout.amount}`);
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as { id: string; amount: number; currency: string };
        const connectAccountId = event.account;

        if (connectAccountId) {
          // Update existing record or insert failed one
          const { data: existing } = await supabase
            .from("seller_payouts")
            .select("id")
            .eq("stripe_payout_id", payout.id)
            .single();

          if (existing) {
            await supabase
              .from("seller_payouts")
              .update({ status: "failed" })
              .eq("stripe_payout_id", payout.id);
          } else {
            await supabase.from("seller_payouts").insert({
              seller_id: await getSellerIdByConnectAccount(connectAccountId),
              stripe_payout_id: payout.id,
              amount: payout.amount / 100,
              currency: payout.currency,
              status: "failed",
            });
          }
        }

        console.log(`[stripe-connect] payout.failed: ${payout.id}`);
        break;
      }

      default:
        console.log(`[stripe-connect] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe-connect] Error processing ${event.type}:`, err);
    // Return 200 to prevent Stripe retries for processing errors
  }

  return NextResponse.json({ received: true });
}

async function getSellerIdByConnectAccount(
  connectAccountId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_connect_id", connectAccountId)
    .single();

  return data?.id || "unknown";
}
