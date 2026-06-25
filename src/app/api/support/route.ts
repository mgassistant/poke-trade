import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const VALID_CATEGORIES = [
  "general", "bug_report", "feature_request", "order_issue",
  "account", "trade_dispute", "billing", "other",
] as const;

// Simple in-memory rate limiter (per process)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string, maxPerHour = 5): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxPerHour) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, subject, category, message } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !category || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("support_tickets")
      .insert({
        user_id: user?.id || null,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        category,
        message: message.trim(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Support ticket error:", error);
      return NextResponse.json({ error: "Failed to create ticket." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, message: "Ticket created successfully." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const serviceClient = await createServiceClient();

  let query = serviceClient
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (!profile?.is_admin) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tickets." }, { status: 500 });
  }

  return NextResponse.json({ tickets: data, isAdmin: !!profile?.is_admin });
}
