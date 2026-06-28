// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const {
    name,
    email,
    phone,
    estimated_collection_value,
    collection_types,
    storage_method,
    has_verified_portfolio,
    consent_portfolio_share,
    current_insurance,
    message,
    consent_to_contact,
  } = body;

  // Validate required fields
  if (!name || !email || !estimated_collection_value) {
    return NextResponse.json(
      { error: "Name, email, and estimated collection value are required" },
      { status: 400 }
    );
  }

  if (!collection_types || !Array.isArray(collection_types) || collection_types.length === 0) {
    return NextResponse.json(
      { error: "At least one collection type is required" },
      { status: 400 }
    );
  }

  const validStorageMethods = ["home", "safe", "bank_vault", "storage_unit", "other"];
  if (storage_method && !validStorageMethods.includes(storage_method)) {
    return NextResponse.json(
      { error: "Invalid storage method" },
      { status: 400 }
    );
  }

  // If user is logged in, fetch their profile and collection stats
  let memberTier = "free";
  let trustScore = 0;
  let collectionStats = null;
  let portfolioSummary = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, trust_score, display_name, username")
      .eq("id", user.id)
      .single();

    if (profile) {
      memberTier = profile.subscription_tier || "free";
      trustScore = profile.trust_score || 0;
    }

    // Fetch collection stats
    const { data: cards, count: cardCount } = await supabase
      .from("collections")
      .select("id, estimated_value, is_graded", { count: "exact" })
      .eq("user_id", user.id);

    if (cards && cards.length > 0) {
      const totalValue = cards.reduce((sum: number, c: any) => sum + (c.estimated_value || 0), 0);
      const gradedCount = cards.filter((c: any) => c.is_graded).length;

      collectionStats = {
        total_cards: cardCount || cards.length,
        total_value: totalValue,
        graded_count: gradedCount,
      };
    }

    // If they consented to share portfolio, build summary
    if (has_verified_portfolio && consent_portfolio_share && collectionStats) {
      portfolioSummary = {
        ...collectionStats,
        member_tier: memberTier,
        trust_score: trustScore,
        portfolio_attached: true,
      };
    }
  }

  // Build admin notes with all the extra context
  const adminNotes = JSON.stringify({
    collection_types,
    current_insurance: current_insurance || "Not specified",
    message: message || null,
    member_tier: memberTier,
    trust_score: trustScore,
    has_verified_portfolio: !!has_verified_portfolio,
    consent_portfolio_share: !!consent_portfolio_share,
    portfolio_summary: portfolioSummary,
    collection_stats: collectionStats,
    submitted_at: new Date().toISOString(),
  });

  // Determine if collection has graded cards from types
  const hasGraded =
    collection_types.includes("Graded Cards") ||
    (collectionStats && collectionStats.graded_count > 0);

  // Insert into insurance_leads table
  const { data: lead, error: insertError } = await supabase
    .from("insurance_leads")
    .insert({
      user_id: user?.id ?? null,
      name,
      email,
      phone: phone || null,
      estimated_collection_value: estimated_collection_value || null,
      number_of_cards: collectionStats?.total_cards || null,
      has_graded_cards: hasGraded ?? false,
      storage_method: storage_method || null,
      consent_to_contact: consent_to_contact ?? true,
      status: "new",
      admin_notes: adminNotes,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Notify admin users via notifications
  if (user) {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_admin", true)
      .limit(5);

    if (admins) {
      for (const admin of admins) {
        await supabase.from("notifications").insert({
          user_id: admin.id,
          notification_type: "insurance_lead",
          title: "New Insurance Quote Request 🛡️",
          message: `${name} (${email}) requested a collectors insurance quote. Est. value: ${estimated_collection_value}. Types: ${collection_types.join(", ")}. Tier: ${memberTier}.`,
          data: { lead_id: lead.id },
        });
      }
    }
  }

  // Send notification email to admin
  const tierBadge = memberTier === "elite" ? "🟣 ELITE" : memberTier === "pro" ? "🔵 PRO" : "⚪ FREE";
  const portfolioFlag = has_verified_portfolio ? "✅ Yes" : "❌ No";

  sendEmail({
    to: "info@poke-trade.com",
    subject: `🛡️ New Insurance Quote Request — ${name} (${estimated_collection_value})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f2044, #1a3a6a); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px;">🛡️ New Insurance Quote Request</h1>
        </div>
        <div style="background: #fff; padding: 24px 32px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Name</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-size: 14px;">${phone || "Not provided"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Est. Value</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #059669;">${estimated_collection_value}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Collection Types</td><td style="padding: 8px 0; font-size: 14px;">${collection_types.join(", ")}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Storage</td><td style="padding: 8px 0; font-size: 14px;">${storage_method || "Not specified"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Member Tier</td><td style="padding: 8px 0; font-size: 14px;">${tierBadge}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Verified Portfolio</td><td style="padding: 8px 0; font-size: 14px;">${portfolioFlag}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Current Insurance</td><td style="padding: 8px 0; font-size: 14px;">${current_insurance || "Not specified"}</td></tr>
          </table>
          ${message ? `<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 8px;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p><p style="margin: 4px 0 0; font-size: 14px; color: #374151;">${message}</p></div>` : ""}
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://poke-trade.com/admin/insurance" style="display: inline-block; background: #0f2044; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Admin CRM</a>
          </div>
        </div>
      </div>
    `,
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    message:
      "Your insurance quote request has been submitted. A licensed insurance specialist will contact you within 1–2 business days.",
  });
}
