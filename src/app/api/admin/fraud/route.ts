// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Get fraud flags with related data
  const { data: flags, error } = await supabase
    .from("fraud_flags")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with profile and listing data
  const enrichedFlags = await Promise.all(
    (flags || []).map(async (flag) => {
      const { data: flagProfile } = await supabase
        .from("profiles")
        .select("username, display_name, trust_score, verification_level")
        .eq("id", flag.user_id)
        .single();

      let listing = null;
      if (flag.listing_id) {
        const { data: listingData } = await supabase
          .from("listings")
          .select("title, price")
          .eq("id", flag.listing_id)
          .single();
        listing = listingData;
      }

      return { ...flag, profile: flagProfile, listing };
    })
  );

  return NextResponse.json({ flags: enrichedFlags });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { flag_id, action } = body;

  if (!flag_id || !action) {
    return NextResponse.json({ error: "flag_id and action are required" }, { status: 400 });
  }

  const validActions = ["approve", "flag", "suspend", "ban"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get the flag
  const { data: flag } = await supabase
    .from("fraud_flags")
    .select("*")
    .eq("id", flag_id)
    .single();

  if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

  // Update flag status
  await supabase
    .from("fraud_flags")
    .update({
      status: action === "approve" ? "approved" : action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", flag_id);

  // If suspending or banning, cancel the listing
  if ((action === "suspend" || action === "ban") && flag.listing_id) {
    await supabase
      .from("listings")
      .update({ status: "cancelled" })
      .eq("id", flag.listing_id);
  }

  // Log admin action
  await supabase.from("admin_actions").insert({
    admin_id: user.id,
    action: `fraud_${action}`,
    target_user_id: flag.user_id,
    target_listing_id: flag.listing_id,
    details: `Fraud flag ${action}: score ${flag.risk_score}, level ${flag.risk_level}`,
  });

  return NextResponse.json({ success: true });
}
