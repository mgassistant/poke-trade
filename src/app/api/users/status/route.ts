// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Update current user's online status
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}

// GET: Get online status for users
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userIds = searchParams.get("ids")?.split(",").filter(Boolean);

  if (!userIds?.length) {
    return NextResponse.json({ statuses: {} });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, last_active_at")
    .in("id", userIds);

  const now = Date.now();
  const statuses: Record<string, string> = {};

  for (const profile of profiles || []) {
    const lastActive = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
    const minutesAgo = (now - lastActive) / 60000;

    if (minutesAgo < 5) statuses[profile.id] = "online";
    else if (minutesAgo < 15) statuses[profile.id] = "away";
    else statuses[profile.id] = "offline";
  }

  return NextResponse.json({ statuses });
}
