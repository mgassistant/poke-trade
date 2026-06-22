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
  const search = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;

  let query = svc.from("profiles").select("*", { count: "exact" });

  if (search) {
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data || [], total: count || 0, page, pageSize: PAGE_SIZE });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();
  const { action, userIds } = body;

  if (!action || !userIds || !Array.isArray(userIds)) {
    return NextResponse.json({ error: "Missing action or userIds" }, { status: 400 });
  }

  let updateData: Record<string, any> = {};
  if (action === "verify") updateData = { is_verified: true };
  else if (action === "unverify") updateData = { is_verified: false };
  else if (action === "suspend") updateData = { is_verified: false };
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { error } = await svc.from("profiles").update(updateData).in("id", userIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log admin action
  for (const targetId of userIds) {
    await svc.from("admin_actions").insert({
      admin_id: user.id,
      action: `bulk_${action}`,
      target_user_id: targetId,
      details: `Bulk ${action} by admin`,
    });
  }

  return NextResponse.json({ success: true });
}
