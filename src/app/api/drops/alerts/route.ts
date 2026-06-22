import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  const since = new Date();
  since.setHours(since.getHours() - 24);

  const { data, count, error } = await supabase
    .from("drop_alerts")
    .select("*, drop_products(product_name, retailer, product_url, image_url, current_price, in_stock)", { count: "exact" })
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    alerts: data || [],
    total: count || 0,
    page,
    limit,
  });
}
