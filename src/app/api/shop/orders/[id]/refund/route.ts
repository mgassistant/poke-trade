import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const body = await request.json();
  const { reason, amount } = body;

  const { data: order } = await supabase
    .from("shop_orders")
    .select("stripe_payment_intent_id, total, status")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.stripe_payment_intent_id) return NextResponse.json({ error: "No payment to refund" }, { status: 400 });
  if (order.status === "refunded") return NextResponse.json({ error: "Already refunded" }, { status: 400 });

  try {
    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmount,
      reason: "requested_by_customer",
    });

    await supabase.from("shop_orders").update({
      status: "refunded",
      refund_amount: refundAmount ? refundAmount / 100 : order.total,
      refunded_at: new Date().toISOString(),
      refund_reason: reason || "Admin refund",
    }).eq("id", id);

    return NextResponse.json({ success: true, refund_id: refund.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
