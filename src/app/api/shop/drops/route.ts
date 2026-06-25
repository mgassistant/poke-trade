import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_drop_events")
    .select("*")
    .in("status", ["upcoming", "live"])
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also get scheduled products
  const { data: scheduledProducts } = await supabase
    .from("shop_products")
    .select("*")
    .eq("status", "scheduled")
    .not("drop_start_at", "is", null)
    .order("drop_start_at", { ascending: true });

  return NextResponse.json({
    drops: data,
    scheduledProducts: scheduledProducts ?? [],
  });
}
