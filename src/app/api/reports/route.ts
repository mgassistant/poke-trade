// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { listing_id, report_type, reason } = body;

  if (!listing_id || !report_type) {
    return NextResponse.json({ error: "listing_id and report_type required" }, { status: 400 });
  }

  // Check for duplicate report
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("listing_id", listing_id)
    .eq("report_type", report_type)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You already reported this listing" }, { status: 400 });
  }

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      listing_id,
      report_type,
      reason: reason || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ report });
}
