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
  const reported = searchParams.get("reported") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;

  if (reported) {
    const { data, count, error } = await svc
      .from("reports")
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(username, display_name),
        listing:listings!reports_reported_listing_id_fkey(id, title, price, status, user_id, card_id)
      `, { count: "exact" })
      .not("reported_listing_id", "is", null)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: data || [], total: count || 0, page, pageSize: PAGE_SIZE });
  }

  let query = svc.from("listings").select(`
    *,
    seller:profiles!listings_user_id_fkey(id, username, display_name, avatar_url),
    card:cards!listings_card_id_fkey(name, image_url, market_value)
  `, { count: "exact" });

  if (status) query = query.eq("status", status);

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ listings: data || [], total: count || 0, page, pageSize: PAGE_SIZE });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();
  const { listingId, action, notes } = body;

  if (!listingId || !action) return NextResponse.json({ error: "Missing listingId or action" }, { status: 400 });

  if (action === "remove") {
    await svc.from("listings").update({ status: "cancelled" }).eq("id", listingId);
  } else if (action === "flag") {
    await svc.from("reports").insert({
      reporter_id: user.id,
      reported_listing_id: listingId,
      report_type: "admin_flag",
      reason: notes || "Flagged by admin",
      status: "reviewed",
    });
  }

  await svc.from("admin_actions").insert({
    admin_id: user.id,
    action: `listing_${action}`,
    target_listing_id: listingId,
    details: notes || `Admin ${action} on listing ${listingId}`,
  });

  return NextResponse.json({ success: true });
}
