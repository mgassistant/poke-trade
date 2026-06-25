import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SHOP_SEED_PRODUCTS } from "@/lib/shop/seed-data";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("shop_products")
    .upsert(SHOP_SEED_PRODUCTS, { onConflict: "slug" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seeded: data?.length ?? 0, products: data });
}
