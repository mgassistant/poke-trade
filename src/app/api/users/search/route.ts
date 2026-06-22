// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, trade_score, trader_level, total_trades")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq("id", user.id)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users });
}
