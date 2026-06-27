import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();

  // Get recent stock checks (last 50)
  const { data: checks } = await svc
    .from("drop_stock_checks")
    .select("*, drop_products(product_name, retailer)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get total active products
  const { count: activeProducts } = await svc
    .from("drop_products")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  // Get products by retailer
  const { data: retailerData } = await svc
    .from("drop_products")
    .select("retailer")
    .eq("active", true);

  const retailerCounts: Record<string, number> = {};
  (retailerData || []).forEach(r => {
    retailerCounts[r.retailer] = (retailerCounts[r.retailer] || 0) + 1;
  });

  // Calculate stats from checks
  const checkList = checks || [];
  const successChecks = checkList.filter(c => !c.error);
  const errorChecks = checkList.filter(c => c.error);
  const successRate = checkList.length > 0 ? Math.round((successChecks.length / checkList.length) * 100) : 100;
  const avgResponseMs = successChecks.length > 0
    ? Math.round(successChecks.reduce((sum, c) => sum + (c.response_ms || 0), 0) / successChecks.length)
    : 0;

  const lastCheck = checkList.length > 0 ? checkList[0] : null;

  return NextResponse.json({
    lastCheck: lastCheck ? {
      time: lastCheck.created_at,
      status: lastCheck.error ? "error" : "success",
    } : null,
    activeProducts: activeProducts || 0,
    retailerCounts,
    checks: checkList,
    stats: {
      successRate,
      avgResponseMs,
      totalChecks: checkList.length,
      errorCount: errorChecks.length,
    },
  });
}
