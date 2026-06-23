// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dispute, error } = await supabase
    .from("disputes")
    .select(`
      *,
      trade_offer:trade_offers(
        id, status, sender_id, receiver_id, created_at,
        sender:profiles!trade_offers_sender_id_fkey(id, username, display_name, avatar_url),
        receiver:profiles!trade_offers_receiver_id_fkey(id, username, display_name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  // User must be initiator, respondent, or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isParty =
    dispute.initiator_id === user.id || dispute.respondent_id === user.id;
  if (!isParty && !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch dispute messages
  const { data: messages } = await supabase
    .from("dispute_messages")
    .select("*")
    .eq("dispute_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ dispute, messages: messages ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  // Fetch the dispute
  const { data: dispute } = await supabase
    .from("disputes")
    .select("*")
    .eq("id", id)
    .single();

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // Add evidence (either party)
  if (action === "add_evidence") {
    const { message, attachments } = body;
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const isParty =
      dispute.initiator_id === user.id || dispute.respondent_id === user.id;
    if (!isParty && !profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: msgErr } = await supabase.from("dispute_messages").insert({
      dispute_id: id,
      sender_id: user.id,
      message,
      attachments: attachments ?? [],
      is_admin: profile?.is_admin ?? false,
    });

    if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

    await supabase
      .from("disputes")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  }

  // Respondent response
  if (action === "respond") {
    if (dispute.respondent_id !== user.id) {
      return NextResponse.json({ error: "Only the respondent can respond" }, { status: 403 });
    }

    const { response, evidence } = body;
    const { error: updateErr } = await supabase
      .from("disputes")
      .update({
        respondent_response: response,
        respondent_evidence: evidence ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Notify initiator
    await supabase.from("notifications").insert({
      user_id: dispute.initiator_id,
      notification_type: "dispute_response",
      title: "Dispute Response Received",
      message: "The other party has responded to your dispute.",
      data: { dispute_id: id },
    });

    return NextResponse.json({ success: true });
  }

  // Escalate (either party)
  if (action === "escalate") {
    const isParty =
      dispute.initiator_id === user.id || dispute.respondent_id === user.id;
    if (!isParty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from("disputes")
      .update({
        status: "investigating",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  }

  // Admin decision
  if (action === "decide") {
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { outcome, reasoning, credit_amount, admin_decision } = body;
    if (!outcome || !reasoning) {
      return NextResponse.json(
        { error: "Outcome and reasoning are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("disputes")
      .update({
        status: "resolved",
        outcome,
        admin_decision: admin_decision ?? outcome,
        admin_reasoning: reasoning,
        admin_decided_by: user.id,
        decided_at: now,
        credit_amount: credit_amount ?? 0,
        updated_at: now,
      })
      .eq("id", id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Notify both parties
    const partyIds = [dispute.initiator_id, dispute.respondent_id].filter(Boolean);
    for (const partyId of partyIds) {
      await supabase.from("notifications").insert({
        user_id: partyId,
        notification_type: "dispute_resolved",
        title: "Dispute Resolved",
        message: `Your dispute has been resolved. Outcome: ${outcome}`,
        data: { dispute_id: id, outcome },
      });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
