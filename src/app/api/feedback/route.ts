import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const VALID_TYPES = ["suggestion", "compliment", "complaint", "general"] as const;

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
    const { name, email, type, message, rating, page_url } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("feedback")
      .insert({
        user_id: user?.id || null,
        name: name?.trim() || null,
        email: email?.trim() || null,
        type,
        message: message.trim(),
        rating: rating || null,
        page_url: page_url || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Feedback error:", error);
      return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, message: "Feedback submitted." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("feedback")
      .select("id, name, type, message, rating, created_at")
      .eq("is_public", true)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
    }
    return NextResponse.json({ feedback: data });
  }

  // Admin access required for full list
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

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }

  return NextResponse.json({ feedback: data });
}
