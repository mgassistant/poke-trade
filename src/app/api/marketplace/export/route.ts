import { NextRequest, NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/export?channel=ebay&format=csv — Export products for marketplace listing
export async function GET(request: NextRequest) {
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const channel = request.nextUrl.searchParams.get("channel") || "csv";
  const format = request.nextUrl.searchParams.get("format") || "csv";
  const category = request.nextUrl.searchParams.get("category");

  // Fetch marketplace-ready products
  let query = supabase
    .from("shop_products")
    .select("*")
    .eq("marketplace_ready", true)
    .in("status", ["active", "sold_out"]);

  if (category) query = query.eq("category", category);

  const { data: products, error } = await query.order("title");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === "json") {
    return NextResponse.json({ products, count: products?.length || 0 });
  }

  // Generate CSV
  const headers = [
    "SKU", "Title", "Description", "Category", "Condition", "Grade", "Grading Company",
    "Set Name", "Card Name", "Card Number", "Rarity", "Brand", "Language",
    "MSRP", "Market Price", "Public Price", "Member Price", "eBay Price", "TCGPlayer Price", "Amazon Price", "Cost Basis",
    "Inventory", "UPC", "Weight (oz)", "Length (in)", "Width (in)", "Height (in)",
    "Handling Days", "Return Policy", "Image URL",
  ];

  const rows = (products || []).map((p) => [
    p.sku || "", p.title || "", (p.description || "").replace(/"/g, '""'), p.category || "", p.condition || "", p.grade || "", p.grading_company || "",
    p.set_name || "", p.card_name || "", p.card_number || "", p.rarity || "", p.brand || "Pokémon", p.language || "English",
    p.msrp_price || "", p.market_price || "", p.public_price || "", p.member_price || "", p.ebay_price || "", p.tcgplayer_price || "", p.amazon_price || "", p.cost_basis || "",
    p.inventory_count || 0, p.upc || "", p.shipping_weight_oz || "", p.shipping_length_in || "", p.shipping_width_in || "", p.shipping_height_in || "",
    p.handling_days || 3, p.return_policy || "30-day returns", Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="poke-trade-${channel}-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
