// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List showcase posts
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("showcase_posts")
    .select(`
      *,
      user:profiles!showcase_posts_user_id_fkey(id, username, display_name, avatar_url, trade_score, trader_level)
    `, { count: "exact" });

  if (filter === "trending") {
    query = query.order("likes_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: posts, count } = await query.range(offset, offset + limit - 1);

  if (!posts) {
    return NextResponse.json({ posts: [], total: 0 });
  }

  // Fetch card data for each post
  const allCardIds = posts.flatMap(p => p.card_ids || []);
  const uniqueCardIds = [...new Set(allCardIds)];

  let cardMap = new Map();
  if (uniqueCardIds.length > 0) {
    const { data: cards } = await supabase
      .from("cards")
      .select("id, name, number, rarity, image_url, market_value, card_sets(name, symbol_url)")
      .in("id", uniqueCardIds);

    if (cards) {
      cardMap = new Map(cards.map(c => [c.id, c]));
    }
  }

  // Check if current user liked each post
  const { data: { user } } = await supabase.auth.getUser();
  let userLikes = new Set<string>();
  if (user && posts.length > 0) {
    const { data: likes } = await supabase
      .from("showcase_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", posts.map(p => p.id));

    if (likes) {
      userLikes = new Set(likes.map(l => l.post_id));
    }
  }

  const enrichedPosts = posts.map(post => ({
    ...post,
    cards: (post.card_ids || []).map((id: string) => cardMap.get(id)).filter(Boolean),
    liked: userLikes.has(post.id),
  }));

  return NextResponse.json({
    posts: enrichedPosts,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST: Create a showcase post
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, card_ids } = body;

  if (!title || !card_ids?.length) {
    return NextResponse.json({ error: "Title and at least one card required" }, { status: 400 });
  }

  if (card_ids.length > 5) {
    return NextResponse.json({ error: "Maximum 5 cards per showcase" }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from("showcase_posts")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      card_ids,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Activity feed
  await supabase.from("activity_feed").insert({
    user_id: user.id,
    activity_type: "showcase_posted",
    data: { title },
    related_id: post.id,
  });

  return NextResponse.json({ post });
}
