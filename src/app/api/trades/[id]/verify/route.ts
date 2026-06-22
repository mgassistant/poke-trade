// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Admin endpoint for auth center verification
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
    .select("id, sender_id, receiver_id, shipping_method")
    .eq("id", id)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  if (trade.shipping_method !== "verified") {
    return NextResponse.json({ error: "Not a verified trade" }, { status: 400 });
  }

  // ===== MARK RECEIVED AT AUTH CENTER =====
  if (action === "received_sender" || action === "received_receiver") {
    const field = action === "received_sender" ? "auth_center_received_sender" : "auth_center_received_receiver";
    await supabase
      .from("trade_shipping_details")
      .update({ [field]: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("trade_offer_id", id);

    return NextResponse.json({ success: true });
  }

  // ===== VERIFY CARDS =====
  if (action === "verify") {
    const { verified, notes } = body;
    await supabase
      .from("trade_shipping_details")
      .update({
        auth_center_verified: verified,
        auth_center_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("trade_offer_id", id);

    // Notify both parties
    for (const uid of [trade.sender_id, trade.receiver_id]) {
      await supabase.from("notifications").insert({
        user_id: uid,
        notification_type: verified ? "trade_verified" : "trade_verification_failed",
        title: verified ? "Cards Verified! ✅" : "Verification Issue ⚠️",
        message: verified
          ? "Your cards have been authenticated and verified. Cross-shipping will begin shortly."
          : `Verification issue: ${notes || "Contact support for details."}`,
        data: { trade_id: id },
      });
    }

    return NextResponse.json({ success: true });
  }

  // ===== ADD CROSS-SHIP TRACKING =====
  if (action === "cross_ship") {
    const { sender_tracking, receiver_tracking } = body;
    await supabase
      .from("trade_shipping_details")
      .update({
        auth_center_cross_ship_sender_tracking: sender_tracking || null,
        auth_center_cross_ship_receiver_tracking: receiver_tracking || null,
        updated_at: new Date().toISOString(),
      })
      .eq("trade_offer_id", id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
