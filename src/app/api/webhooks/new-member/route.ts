import { NextRequest, NextResponse } from "next/server";
import { notifyNewMember } from "@/lib/email-notifications";

/**
 * Supabase Auth Webhook — fires on new user signup.
 * Configure in Supabase Dashboard → Auth → Webhooks → insert event on auth.users
 * URL: https://poke-trade.com/api/webhooks/new-member
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret if configured
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { type?: string; record?: { id?: string; email?: string; raw_user_meta_data?: { username?: string; display_name?: string } } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Supabase sends { type: "INSERT", table: "users", schema: "auth", record: {...} }
  const record = body.record;
  if (!record?.email) {
    return NextResponse.json({ error: "No email in record" }, { status: 400 });
  }

  const username =
    record.raw_user_meta_data?.display_name ||
    record.raw_user_meta_data?.username ||
    record.email.split("@")[0];

  // Fire-and-forget email notifications
  notifyNewMember(username, record.email);

  return NextResponse.json({ success: true });
}
