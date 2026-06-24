import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_connect_id) {
    return NextResponse.json({ error: "No Connect account" }, { status: 400 });
  }

  try {
    // Get balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_connect_id,
    });

    // Get recent payouts
    const payouts = await stripe.payouts.list(
      { limit: 20 },
      { stripeAccount: profile.stripe_connect_id }
    );

    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    return NextResponse.json({
      available_balance: availableBalance,
      pending_balance: pendingBalance,
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        status: p.status,
        arrival_date: new Date(p.arrival_date * 1000).toISOString(),
        created: new Date(p.created * 1000).toISOString(),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch payout data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
