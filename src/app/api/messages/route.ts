// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/messages — List conversations or messages in a conversation
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");

  // If conversation_id specified, return messages
  if (conversationId) {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark unread messages as read
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    return NextResponse.json({ messages });
  }

  // Otherwise list conversations
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(`
      *,
      participant1:profiles!conversations_participant_1_fkey(id, username, display_name, avatar_url),
      participant2:profiles!conversations_participant_2_fkey(id, username, display_name, avatar_url)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get last message and unread count for each conversation
  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, sender_id, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("read_at", null);

      return {
        ...conv,
        last_message: lastMsg,
        unread_count: count || 0,
      };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

// POST /api/messages — Send a message
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { recipient_id, conversation_id, content } = body;

  if (!content?.trim()) return NextResponse.json({ error: "Message content required" }, { status: 400 });

  let convId = conversation_id;

  // If no conversation_id, find or create conversation
  if (!convId && recipient_id) {
    if (recipient_id === user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Order participant IDs consistently
    const p1 = user.id < recipient_id ? user.id : recipient_id;
    const p2 = user.id < recipient_id ? recipient_id : user.id;

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .single();

    if (existing) {
      convId = existing.id;
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({ participant_1: p1, participant_2: p2 })
        .select()
        .single();

      if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });
      convId = newConv.id;
    }
  }

  if (!convId) return NextResponse.json({ error: "Conversation or recipient required" }, { status: 400 });

  // Insert message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: convId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", convId);

  return NextResponse.json({ message, conversation_id: convId });
}
