import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;

  // Trades that have shipping tracking (verified shipping)
  let query = svc.from("trade_offers").select(`
    *,
    sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url),
    receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url)
  `, { count: "exact" })
    .not("shipping_tracking_sender", "is", null);

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", ["accepted", "completed"]);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ trades: data || [], total: count || 0, page, pageSize: PAGE_SIZE });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();
  const { tradeId, action, notes } = body;

  if (!tradeId || !action) return NextResponse.json({ error: "Missing tradeId or action" }, { status: 400 });

  const updates: Record<string, any> = {};

  switch (action) {
    case "mark_received_sender":
      updates.received_at_sender = new Date().toISOString();
      break;
    case "mark_received_receiver":
      updates.received_at_receiver = new Date().toISOString();
      break;
    case "approve":
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
      break;
    case "reject":
      updates.status = "cancelled";
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await svc.from("trade_offers").update(updates).eq("id", tradeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc.from("admin_actions").insert({
    admin_id: user.id,
    action: `verification_${action}`,
    details: `Trade ${tradeId}: ${action}. ${notes || ""}`,
  });

  return NextResponse.json({ success: true });
}
