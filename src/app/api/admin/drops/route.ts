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
  const offset = (page - 1) * 20;

  const { data, count, error } = await svc
    .from("drop_products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + 19);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data || [], total: count || 0, page, pageSize: 20 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();

  if (body.action === "trigger_alert") {
    const { productId } = body;
    const { data: product } = await svc.from("drop_products").select("*").eq("id", productId).single();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await svc.from("drop_alerts").insert({
      product_id: productId,
      alert_type: "manual_alert",
      title: `Alert: ${product.product_name}`,
      message: `Manual alert triggered by admin for ${product.product_name}`,
    });

    return NextResponse.json({ success: true });
  }

  // Create product
  const { retailer, product_name, product_url, image_url, retail_price, category, set_name, release_date } = body;
  if (!retailer || !product_name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data, error } = await svc.from("drop_products").insert({
    retailer,
    product_name,
    product_url: product_url || null,
    image_url: image_url || null,
    retail_price: retail_price || null,
    category: category || null,
    set_name: set_name || null,
    release_date: release_date || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ product: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const body = await req.json();
  const { productId, ...updates } = body;

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const { error } = await svc.from("drop_products").update(updates).eq("id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("id");

  if (!productId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await svc.from("drop_products").delete().eq("id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
