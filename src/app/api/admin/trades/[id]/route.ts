import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const svc = await createServiceClient();

  const [tradeRes, itemsRes, disputeRes] = await Promise.all([
    svc.from("trade_offers").select(`
      *,
      sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url),
      receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url)
    `).eq("id", id).single(),
    svc.from("trade_items").select(`*, card:cards(id, name, image_url, market_value)`).eq("trade_offer_id", id),
    svc.from("disputes").select("*").eq("trade_offer_id", id).maybeSingle(),
  ]);

  if (tradeRes.error) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  return NextResponse.json({
    trade: tradeRes.data,
    items: itemsRes.data || [],
    dispute: disputeRes.data,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const svc = await createServiceClient();
  const body = await req.json();
  const { action, resolution, notes } = body;

  if (action === "resolve_dispute") {
    await svc.from("disputes").update({
      status: "resolved",
      resolution: resolution || notes || "Resolved by admin",
    }).eq("trade_offer_id", id);

    await svc.from("trade_offers").update({ status: "cancelled" }).eq("id", id);

    await svc.from("admin_actions").insert({
      admin_id: user.id,
      action: "resolve_dispute",
      details: `Resolved dispute for trade ${id}: ${resolution || notes || "No details"}`,
    });
  } else if (action === "cancel") {
    await svc.from("trade_offers").update({ status: "cancelled" }).eq("id", id);
    await svc.from("admin_actions").insert({
      admin_id: user.id,
      action: "cancel_trade",
      details: `Cancelled trade ${id}: ${notes || "Admin action"}`,
    });
  }

  return NextResponse.json({ success: true });
}
