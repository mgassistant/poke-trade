import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Helper: check if user has drop_alerts_active */
async function hasDropAlerts(userId: string): Promise<boolean> {
  const { data } = await serviceClient
    .from("profiles")
    .select("drop_alerts_active")
    .eq("id", userId)
    .single();
  return data?.drop_alerts_active === true;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only subscribers can view watchlist
  const subscribed = await hasDropAlerts(user.id);
  if (!subscribed) {
    return NextResponse.json({ watchlist: [], subscribed: false });
  }

  const { data, error } = await serviceClient
    .from("drop_watchlist")
    .select("*, drop_products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ watchlist: data || [], subscribed: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gate: must have active drop alerts subscription
  const subscribed = await hasDropAlerts(user.id);
  if (!subscribed) {
    return NextResponse.json(
      { error: "Drop Alerts subscription required. Subscribe for $5.99/mo to add items to your watchlist." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    product_id,
    notify_restock = true,
    notify_price_drop = true,
    target_price,
  } = body;

  if (!product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from("drop_watchlist")
    .upsert(
      {
        user_id: user.id,
        product_id,
        notify_restock,
        notify_price_drop,
        target_price: target_price || null,
      },
      { onConflict: "user_id,product_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ watchlist_item: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const { error } = await serviceClient
    .from("drop_watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
