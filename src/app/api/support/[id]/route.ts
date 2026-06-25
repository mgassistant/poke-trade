import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const serviceClient = await createServiceClient();

  const { data: ticket, error } = await serviceClient
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  // Only allow owner or admin
  if (ticket.user_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: replies } = await serviceClient
    .from("support_replies")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ticket, replies: replies || [], isAdmin: !!profile?.is_admin });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.status) updates.status = body.status;
    if (body.priority) updates.priority = body.priority;
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
    if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.status === "resolved" || body.status === "closed") {
      updates.resolved_at = new Date().toISOString();
    }

    const serviceClient = await createServiceClient();
    const { error } = await serviceClient
      .from("support_tickets")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to update ticket." }, { status: 500 });
    }

    return NextResponse.json({ message: "Ticket updated." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    // Check ticket access
    const serviceClient = await createServiceClient();
    const { data: ticket } = await serviceClient
      .from("support_tickets")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    if (ticket.user_id !== user.id && !profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await serviceClient
      .from("support_replies")
      .insert({
        ticket_id: id,
        user_id: user.id,
        is_admin: !!profile?.is_admin,
        message: message.trim(),
      });

    if (error) {
      return NextResponse.json({ error: "Failed to add reply." }, { status: 500 });
    }

    // If admin replies, update ticket status to open/in_progress
    if (profile?.is_admin) {
      await serviceClient
        .from("support_tickets")
        .update({ status: "in_progress" })
        .eq("id", id)
        .in("status", ["new", "open"]);
    }

    return NextResponse.json({ message: "Reply added." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
