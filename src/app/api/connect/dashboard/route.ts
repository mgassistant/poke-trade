import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_connect_id) {
    return NextResponse.json({ error: "No Connect account found. Complete seller setup first." }, { status: 400 });
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_id);
    return NextResponse.json({ url: loginLink.url });
  } catch {
    return NextResponse.json({ error: "Failed to create dashboard link. Complete onboarding first." }, { status: 400 });
  }
}
