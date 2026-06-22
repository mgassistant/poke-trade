// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/listings/[id] — Get a single listing
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      user:profiles!listings_user_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level, verification_level),
      card:cards!listings_card_id_fkey(id, name, number, rarity, image_url, market_value, card_sets(name, symbol_url))
    `)
    .eq("id", id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

// PATCH /api/listings/[id] — Update listing (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: listingData } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  const listing = listingData as { id: string; user_id: string; status: string } | null;
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.user_id !== user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 });

  const body = await request.json();
  const allowedFields = ["title", "description", "condition", "price", "shipping_cost", "accepts_offers", "status", "photos"];
  const updates: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Can't reactivate sold listings
  if (updates.status === "active" && listing.status === "sold") {
    return NextResponse.json({ error: "Cannot reactivate a sold listing" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ listing: updated });
}

// DELETE /api/listings/[id] — Delete listing (owner only, only if not sold)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: delListingData } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  const delListing = delListingData as { id: string; user_id: string; status: string } | null;
  if (!delListing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (delListing.user_id !== user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  if (delListing.status === "sold") return NextResponse.json({ error: "Cannot delete a sold listing" }, { status: 400 });

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
