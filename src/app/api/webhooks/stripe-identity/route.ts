import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "identity.verification_session.verified") {
    const session = event.data.object as { metadata?: { user_id?: string } };
    const userId = session.metadata?.user_id;

    if (userId) {
      const supabase = await createServiceClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_level, verification_data")
        .eq("id", userId)
        .single();

      const existingData =
        (profile?.verification_data as Record<string, unknown>) ?? {};
      const newLevel = Math.max(profile?.verification_level ?? 0, 3);

      await supabase
        .from("profiles")
        .update({
          id_verified: true,
          verification_level: newLevel,
          verification_data: {
            ...existingData,
            id_verified_at: new Date().toISOString(),
            stripe_identity_session: event.id,
          },
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
