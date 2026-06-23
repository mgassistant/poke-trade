// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Like or comment on a showcase post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, text } = body;

  if (action === "like") {
    // Toggle like
    const { data: existing } = await supabase
      .from("showcase_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", id)
      .single();

    if (existing) {
      // Unlike
      await supabase.from("showcase_likes").delete().eq("id", existing.id);
      await supabase.rpc("decrement_likes", { post_id: id }).catch(() => {
        // Fallback: direct update
        return supabase
          .from("showcase_posts")
          .update({ likes_count: supabase.rpc ? 0 : 0 })
          .eq("id", id);
      });
      // Manual decrement
      const { data: post } = await supabase.from("showcase_posts").select("likes_count").eq("id", id).single();
      if (post) {
        await supabase.from("showcase_posts").update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) }).eq("id", id);
      }
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabase.from("showcase_likes").insert({ user_id: user.id, post_id: id });
      const { data: post } = await supabase.from("showcase_posts").select("likes_count").eq("id", id).single();
      if (post) {
        await supabase.from("showcase_posts").update({ likes_count: (post.likes_count || 0) + 1 }).eq("id", id);
      }
      return NextResponse.json({ liked: true });
    }
  }

  if (action === "comment") {
    if (!text?.trim()) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("showcase_comments")
      .insert({
        user_id: user.id,
        post_id: id,
        text: text.trim(),
      })
      .select(`
        *,
        user:profiles!showcase_comments_user_id_fkey(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comment });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET: Get comments for a post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("showcase_comments")
    .select(`
      *,
      user:profiles!showcase_comments_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("post_id", id)
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({ comments: comments || [] });
}
