import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const startedAt = Date.now();

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Database connectivity
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const start = Date.now();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);
    const latency = Date.now() - start;

    if (error) {
      checks.database = `error: ${error.message}`;
      healthy = false;
    } else {
      checks.database = `ok (${latency}ms)`;
    }
  } catch (err) {
    checks.database = "unreachable";
    healthy = false;
  }

  // Stripe connectivity
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    checks.stripe = stripeKey ? "configured" : "not configured";
    if (!stripeKey) healthy = false;
  } catch {
    checks.stripe = "error";
    healthy = false;
  }

  // Environment check
  checks.environment = process.env.NODE_ENV || "unknown";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      version: process.env.npm_package_version || "0.1.0",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
