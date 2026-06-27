// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = request.nextUrl.searchParams.get("admin") === "true";

  // If admin=true, verify admin role and return ALL disputes
  if (isAdmin) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const svc = await createServiceClient();
    const status = request.nextUrl.searchParams.get("status");
    let query = svc
      .from("disputes")
      .select(`
        *,
        trade_offer:trade_offers(
          id, status, sender_id, receiver_id, created_at,
          sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url),
          receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status && status !== "all") query = query.eq("status", status);

    const { data: disputes, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ disputes });
  }

  // Regular user: return only their disputes
  const { data: disputes, error } = await supabase
    .from("disputes")
    .select(`
      *,
      trade_offer:trade_offers(
        id, status, sender_id, receiver_id, created_at,
        sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url),
        receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url)
      )
    `)
    .eq("initiator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ disputes });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { trade_offer_id, reason, details } = body;

  if (!trade_offer_id || !reason) {
    return NextResponse.json({ error: "Trade ID and reason are required" }, { status: 400 });
  }

  // Verify user is part of the trade
  const { data: trade } = await supabase
    .from("trade_offers")
    .select("*")
    .eq("id", trade_offer_id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  // Check for existing open dispute
  const { data: existing } = await supabase
    .from("disputes")
    .select("id")
    .eq("trade_offer_id", trade_offer_id)
    .in("status", ["open", "investigating"])
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "An open dispute already exists for this trade" }, { status: 400 });
  }

  const { data: dispute, error } = await supabase
    .from("disputes")
    .insert({
      trade_offer_id,
      initiator_id: user.id,
      reason,
      details: details || null,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update trade status
  await supabase
    .from("trade_offers")
    .update({ status: "disputed" as "completed", updated_at: new Date().toISOString() })
    .eq("id", trade_offer_id);

  // Notify the other party
  const otherUserId = trade.sender_id === user.id ? trade.receiver_id : trade.sender_id;
  await supabase.from("notifications").insert({
    user_id: otherUserId,
    notification_type: "dispute_opened",
    title: "Dispute Opened ⚠️",
    message: `A dispute has been opened for trade: ${reason}`,
    data: { trade_id: trade_offer_id, dispute_id: dispute.id },
  });

  return NextResponse.json({ dispute });
}
