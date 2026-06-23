import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_id, username, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let connectId = profile.stripe_connect_id;

  // Create Connect Express account if none exists
  if (!connectId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
        username: profile.username,
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    connectId = account.id;

    await supabase
      .from("profiles")
      .update({ stripe_connect_id: connectId })
      .eq("id", user.id);
  }

  // Create an account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${origin}/dashboard/seller-setup?refresh=true`,
    return_url: `${origin}/dashboard/seller-setup?success=true`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
