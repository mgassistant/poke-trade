// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/membership — Get current user's membership info
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, is_premium, stripe_customer_id")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    tier: profile?.subscription_tier || "free",
    is_premium: profile?.is_premium || false,
    has_stripe_customer: !!profile?.stripe_customer_id,
  });
}
