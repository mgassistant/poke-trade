import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();

  // Get recent admin actions as announcements history
  const { data, error } = await svc
    .from("admin_actions")
    .select("*")
    .eq("action", "announcement")
    .order("performed_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ announcements: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();
  const { title, message, type } = body;

  if (!title || !message) return NextResponse.json({ error: "Missing title or message" }, { status: 400 });

  // Store announcement as admin action
  await svc.from("admin_actions").insert({
    admin_id: user.id,
    action: "announcement",
    details: JSON.stringify({ title, message, type: type || "info" }),
  });

  // Send notification to all users
  const { data: users } = await svc.from("profiles").select("id");
  if (users && users.length > 0) {
    const notifications = users.map((u: any) => ({
      user_id: u.id,
      notification_type: "announcement",
      title,
      message,
      data: { type: type || "info" },
    }));

    // Batch insert (Supabase handles arrays)
    await svc.from("notifications").insert(notifications);
  }

  return NextResponse.json({ success: true });
}
