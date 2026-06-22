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
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;

  let query = svc.from("reports").select(`
    *,
    reporter:profiles!reports_reporter_id_fkey(username, display_name, avatar_url),
    reported_user:profiles!reports_reported_user_id_fkey(username, display_name),
    listing:listings!reports_reported_listing_id_fkey(id, title, price)
  `, { count: "exact" });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("report_type", type);

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get summary stats
  const [pendingRes, resolvedRes, dismissedRes] = await Promise.all([
    svc.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    svc.from("reports").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    svc.from("reports").select("*", { count: "exact", head: true }).eq("status", "dismissed"),
  ]);

  return NextResponse.json({
    reports: data || [],
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    summary: {
      pending: pendingRes.count || 0,
      resolved: resolvedRes.count || 0,
      dismissed: dismissedRes.count || 0,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();
  const { reportId, action, notes } = body;

  if (!reportId || !action) return NextResponse.json({ error: "Missing reportId or action" }, { status: 400 });

  let newStatus = "reviewed";
  if (action === "resolve") newStatus = "resolved";
  else if (action === "dismiss") newStatus = "dismissed";
  else if (action === "review") newStatus = "reviewed";

  const { error } = await svc.from("reports").update({
    status: newStatus,
    details: notes ? `Admin notes: ${notes}` : undefined,
  }).eq("id", reportId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc.from("admin_actions").insert({
    admin_id: user.id,
    action: `report_${action}`,
    details: `Report ${reportId}: ${action}. ${notes || ""}`,
  });

  return NextResponse.json({ success: true });
}
