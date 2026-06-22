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

  const [profileRes, tradesRes, listingsRes, ordersRes] = await Promise.all([
    svc.from("profiles").select("*").eq("id", id).single(),
    svc.from("trade_offers").select("*", { count: "exact", head: true }).or(`sender_id.eq.${id},receiver_id.eq.${id}`),
    svc.from("listings").select("*", { count: "exact", head: true }).eq("user_id", id),
    svc.from("orders").select("*", { count: "exact", head: true }).or(`buyer_id.eq.${id},seller_id.eq.${id}`),
  ]);

  if (profileRes.error) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: profileRes.data,
    counts: {
      trades: tradesRes.count || 0,
      listings: listingsRes.count || 0,
      orders: ordersRes.count || 0,
    },
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
  const { action } = body;

  let updateData: Record<string, any> = {};
  let actionLabel = "";

  switch (action) {
    case "toggle_admin":
      const { data: target } = await svc.from("profiles").select("is_admin").eq("id", id).single();
      updateData = { is_admin: !target?.is_admin };
      actionLabel = target?.is_admin ? "remove_admin" : "grant_admin";
      break;
    case "toggle_verified":
      const { data: target2 } = await svc.from("profiles").select("is_verified").eq("id", id).single();
      updateData = { is_verified: !target2?.is_verified };
      actionLabel = target2?.is_verified ? "unverify" : "verify";
      break;
    case "suspend":
      updateData = { is_verified: false, is_premium: false };
      actionLabel = "suspend";
      break;
    case "unsuspend":
      updateData = { is_verified: false };
      actionLabel = "unsuspend";
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await svc.from("profiles").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc.from("admin_actions").insert({
    admin_id: user.id,
    action: actionLabel,
    target_user_id: id,
    details: `Admin ${actionLabel} on user ${id}`,
  });

  return NextResponse.json({ success: true });
}
