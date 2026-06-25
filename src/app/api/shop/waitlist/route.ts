import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to join waitlist" }, { status: 401 });

  const { product_id } = await request.json();
  if (!product_id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  // Check product exists and is sold out
  const { data: product } = await supabase
    .from("shop_products")
    .select("id, status, title")
    .eq("id", product_id)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("shop_waitlists")
    .upsert(
      { user_id: user.id, product_id, email: user.email },
      { onConflict: "user_id,product_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ waitlist: data });
}
