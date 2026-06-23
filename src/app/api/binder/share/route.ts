// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user already has a share link
  const { data: existing } = await supabase
    .from("shared_binders")
    .select("id, share_code")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (existing) {
    return NextResponse.json({ share_code: existing.share_code });
  }

  // Generate a unique share code
  const shareCode = Array.from({ length: 8 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");

  const { data: shared, error } = await supabase
    .from("shared_binders")
    .insert({
      user_id: user.id,
      share_code: shareCode,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ share_code: shared.share_code });
}
