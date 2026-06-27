import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
  const alertType = searchParams.get("alert_type");
  const retailer = searchParams.get("retailer");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const offset = (page - 1) * limit;

  // Build query for alerts with joined product data
  let query = svc
    .from("drop_alerts")
    .select("*, drop_products!inner(product_name, retailer, image_url, current_price)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (alertType) query = query.eq("alert_type", alertType);
  if (retailer) query = query.eq("drop_products.retailer", retailer);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data: alerts, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get unique retailers for filter dropdown
  const { data: retailers } = await svc
    .from("drop_products")
    .select("retailer")
    .eq("active", true);

  const uniqueRetailers = [...new Set((retailers || []).map(r => r.retailer))].sort();

  return NextResponse.json({
    alerts: alerts || [],
    total: count || 0,
    page,
    pageSize: limit,
    retailers: uniqueRetailers,
  });
}
