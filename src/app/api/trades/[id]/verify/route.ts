// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Admin endpoint for trade protection dispute review and management.
// Poké-Trade does NOT receive, inspect, authenticate, or ship any items.
// All items are shipped directly between users.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  const { data: trade } = await supabase
    .from("trade_offers")
    .select("id, sender_id, receiver_id, shipping_method, trade_protection_selected")
    .eq("id", id)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  if (trade.shipping_method !== "protected" && !trade.trade_protection_selected) {
    return NextResponse.json({ error: "Not a protected trade" }, { status: 400 });
  }

  // ===== REVIEW DISPUTE =====
  if (action === "review_dispute") {
    const { resolution, notes } = body;

    // Notify both parties of dispute resolution
    for (const uid of [trade.sender_id, trade.receiver_id]) {
      await supabase.from("notifications").insert({
        user_id: uid,
        notification_type: "trade_dispute_reviewed",
        title: "Dispute Reviewed",
        message: `Your trade dispute has been reviewed. Resolution: ${resolution || "See details."}${notes ? ` Notes: ${notes}` : ""}`,
        data: { trade_id: id },
      });
    }

    return NextResponse.json({ success: true });
  }

  // ===== UPDATE AUTHORIZATION STATUS =====
  if (action === "update_auth_status") {
    const { party, status, amount } = body;
    const field_status = party === "sender" ? "sender_auth_status" : "receiver_auth_status";
    const field_amount = party === "sender" ? "sender_auth_amount" : "receiver_auth_amount";

    await supabase
      .from("trade_offers")
      .update({
        [field_status]: status,
        [field_amount]: amount || 0,
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
