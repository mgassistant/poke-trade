// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("stripe_customer_id, subscription_tier")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  if (profile.subscription_tier === "free") {
    return NextResponse.json({ error: "Already on Free plan" }, { status: 400 });
  }

  // Find active subscription for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    // No active Stripe subscription — just update DB
    await serviceClient
      .from("profiles")
      .update({ subscription_tier: "free", is_premium: false })
      .eq("id", user.id);

    return NextResponse.json({ success: true, message: "Subscription cancelled" });
  }

  // Cancel at period end
  await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({
    success: true,
    message: "Subscription will cancel at end of billing period",
    cancel_at: subscriptions.data[0].cancel_at,
  });
}
