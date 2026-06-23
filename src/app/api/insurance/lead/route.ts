// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyInsuranceLead } from "@/lib/email-notifications";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const {
    name,
    email,
    phone,
    estimated_collection_value,
    number_of_cards,
    has_graded_cards,
    storage_method,
    consent_to_contact,
  } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
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

  const { data: lead, error } = await supabase
    .from("insurance_leads")
    .insert({
      user_id: user?.id ?? null,
      name,
      email,
      phone: phone || null,
      estimated_collection_value: estimated_collection_value || null,
      number_of_cards: number_of_cards || null,
      has_graded_cards: has_graded_cards ?? false,
      storage_method: storage_method || null,
      consent_to_contact: consent_to_contact ?? true,
      status: "new",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify admin (Maria) via notification if user exists
  // In production, this would also send an email
  if (user) {
    // Find admin users to notify
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
          title: "New Insurance Referral Lead 📋",
          message: `${name} (${email}) submitted an insurance inquiry. Estimated value: $${estimated_collection_value ?? "N/A"}`,
          data: { lead_id: lead.id },
        });
      }
    }
  }

  // Email notification (fire-and-forget)
  notifyInsuranceLead(name, email, estimated_collection_value || 0);

  return NextResponse.json({
    success: true,
    message:
      "Your inquiry has been submitted. A licensed insurance specialist will contact you within 1-2 business days.",
  });
}
