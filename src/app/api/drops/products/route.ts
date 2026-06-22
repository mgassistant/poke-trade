import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGE_SIZE = 24;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const retailer = searchParams.get("retailer") || "";
  const category = searchParams.get("category") || "";
  const inStock = searchParams.get("in_stock");
  const search = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("drop_products")
    .select("*", { count: "exact" });

  if (search) {
    query = query.ilike("product_name", `%${search}%`);
  }
  if (retailer) {
    query = query.eq("retailer", retailer);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (inStock === "true") {
    query = query.eq("in_stock", true);
  } else if (inStock === "false") {
    query = query.eq("in_stock", false);
  }

  switch (sort) {
    case "price-asc":
      query = query.order("current_price", { ascending: true, nullsFirst: true });
      break;
    case "price-desc":
      query = query.order("current_price", { ascending: false, nullsFirst: false });
      break;
    case "restocked":
      query = query.order("last_in_stock_at", { ascending: false, nullsFirst: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data || [],
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  });
}
