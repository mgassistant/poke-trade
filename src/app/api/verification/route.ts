import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "verification_level, phone_verified, id_verified, address_verified, verification_data"
    )
    .eq("id", user.id)
    .single();

  const emailVerified = !!user.email_confirmed_at;

  return NextResponse.json({
    email_verified: emailVerified,
    phone_verified: profile?.phone_verified ?? false,
    id_verified: profile?.id_verified ?? false,
    address_verified: profile?.address_verified ?? false,
    verification_level: profile?.verification_level ?? 0,
    verification_data: profile?.verification_data ?? {},
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type } = body as { type: string };

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "verification_level, phone_verified, id_verified, address_verified, verification_data"
    )
    .eq("id", user.id)
    .single();

  switch (type) {
    case "email": {
      // Trigger Supabase email re-verification
      const emailVerified = !!user.email_confirmed_at;
      if (emailVerified) {
        // Already verified — update level if needed
        if ((profile?.verification_level ?? 0) < 1) {
          await supabase
            .from("profiles")
            .update({ verification_level: 1 })
            .eq("id", user.id);
        }
        return NextResponse.json({ status: "already_verified", level: 1 });
      }

      // Resend verification email
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: user.email!,
      });

      if (resendError) {
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "email_sent" });
    }

    case "phone": {
      const { phone } = body as { phone?: string };
      if (!phone) {
        return NextResponse.json(
          { error: "Phone number required" },
          { status: 400 }
        );
      }

      // Store phone for verification
      const existingData = (profile?.verification_data as Record<string, unknown>) ?? {};
      await supabase
        .from("profiles")
        .update({
          verification_data: {
            ...existingData,
            phone_pending: phone,
            phone_code: String(Math.floor(100000 + Math.random() * 900000)),
            phone_code_expires: new Date(
              Date.now() + 10 * 60 * 1000
            ).toISOString(),
          },
        })
        .eq("id", user.id);

      // In production, send SMS via Twilio/etc. For now, store code in verification_data.
      return NextResponse.json({
        status: "code_sent",
        message: "Verification code sent (check verification_data in dev)",
      });
    }

    case "phone_verify": {
      const { code } = body as { code?: string };
      if (!code) {
        return NextResponse.json(
          { error: "Verification code required" },
          { status: 400 }
        );
      }

      const vData = (profile?.verification_data as Record<string, unknown>) ?? {};
      if (
        vData.phone_code !== code ||
        !vData.phone_code_expires ||
        new Date(vData.phone_code_expires as string) < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const newLevel = Math.max(profile?.verification_level ?? 0, 2);
      await supabase
        .from("profiles")
        .update({
          phone_verified: true,
          verification_level: newLevel,
          verification_data: {
            ...vData,
            phone_verified_at: new Date().toISOString(),
            phone_code: null,
            phone_code_expires: null,
          },
        })
        .eq("id", user.id);

      return NextResponse.json({ status: "verified", level: newLevel });
    }

    case "id": {
      // Check if Stripe Identity is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({
          status: "coming_soon",
          message: "ID verification is coming soon",
        });
      }

      try {
        const session = await stripe.identity.verificationSessions.create({
          type: "document",
          metadata: {
            user_id: user.id,
          },
          options: {
            document: {
              require_matching_selfie: true,
            },
          },
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/settings/verification?id_verified=true`,
        });

        return NextResponse.json({
          status: "session_created",
          url: session.url,
          session_id: session.id,
        });
      } catch (stripeError) {
        // Stripe Identity may not be available on all accounts
        const errorMessage =
          stripeError instanceof Error ? stripeError.message : "Unknown error";
        if (
          errorMessage.includes("not available") ||
          errorMessage.includes("not enabled")
        ) {
          return NextResponse.json({
            status: "coming_soon",
            message: "ID verification is coming soon",
          });
        }
        return NextResponse.json(
          { error: "Failed to create verification session" },
          { status: 500 }
        );
      }
    }

    case "address": {
      const { address } = body as {
        address?: { line1: string; city: string; state: string; zip: string };
      };
      if (!address?.line1 || !address?.city || !address?.state || !address?.zip) {
        return NextResponse.json(
          { error: "Complete address required" },
          { status: 400 }
        );
      }

      const existData = (profile?.verification_data as Record<string, unknown>) ?? {};
      const newLvl = Math.max(profile?.verification_level ?? 0, 4);
      await supabase
        .from("profiles")
        .update({
          address_verified: true,
          verification_level: newLvl,
          verification_data: {
            ...existData,
            address,
            address_verified_at: new Date().toISOString(),
          },
        })
        .eq("id", user.id);

      return NextResponse.json({ status: "verified", level: newLvl });
    }

    default:
      return NextResponse.json(
        { error: "Invalid verification type" },
        { status: 400 }
      );
  }
}
