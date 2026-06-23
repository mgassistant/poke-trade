import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_connect_id) {
    return NextResponse.json({
      connected: false,
      payouts_enabled: false,
      charges_enabled: false,
      details_submitted: false,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);

    return NextResponse.json({
      connected: true,
      payouts_enabled: account.payouts_enabled ?? false,
      charges_enabled: account.charges_enabled ?? false,
      details_submitted: account.details_submitted ?? false,
      account_id: account.id,
    });
  } catch {
    return NextResponse.json({
      connected: false,
      payouts_enabled: false,
      charges_enabled: false,
      details_submitted: false,
      error: "Failed to retrieve account status",
    });
  }
}
