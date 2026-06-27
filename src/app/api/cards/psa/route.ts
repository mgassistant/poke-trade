import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { lookupPSACert } from "@/lib/psa";

// GET /api/cards/psa?cert=12345678 — Look up PSA cert (cached in DB)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const certNumber = request.nextUrl.searchParams.get("cert");
  if (!certNumber) {
    return NextResponse.json({ error: "cert parameter required" }, { status: 400 });
  }

  const cleaned = certNumber.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 5) {
    return NextResponse.json({ error: "Invalid cert number (min 5 digits)" }, { status: 400 });
  }

  const svc = await createServiceClient();

  // Check cache first
  const { data: cached } = await svc
    .from("psa_cert_cache")
    .select("*")
    .eq("cert_number", cleaned)
    .single();

  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached.cert_data,
      cached: true,
      cached_at: cached.created_at,
    });
  }

  // Not cached — call PSA API
  const result = await lookupPSACert(cleaned);

  if (result.success && result.data) {
    // Cache the result
    await svc.from("psa_cert_cache").upsert({
      cert_number: cleaned,
      cert_data: result.data,
      card_name: result.data.Subject || null,
      card_grade: result.data.CardGrade || null,
      grade_description: result.data.GradeDescription || null,
      year: result.data.Year || null,
      brand: result.data.Brand || null,
      population: result.data.TotalPopulation || 0,
      population_higher: result.data.PopulationHigher || 0,
      created_at: new Date().toISOString(),
    });

    // Log the lookup
    await svc.from("audit_log").insert({
      user_id: user.id,
      action: "psa_cert_lookup",
      details: { cert_number: cleaned, found: true },
    });
  }

  return NextResponse.json(result);
}
