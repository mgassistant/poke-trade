/**
 * eBay Marketplace Account Deletion/Closure Notification Endpoint
 * Required by eBay for all API apps (compliance webhook)
 * 
 * Handles:
 * 1. GET — eBay verification challenge (returns challengeResponse hash)
 * 2. POST — Account deletion notifications (acknowledge with 200)
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || "poketrade-ebay-verify-2026";
const ENDPOINT_URL = "https://poke-trade.com/api/ebay/account-deletion";

// GET: eBay sends a challenge_code, we must return a hash
export async function GET(req: NextRequest) {
  const challengeCode = req.nextUrl.searchParams.get("challenge_code");

  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  // eBay requires: SHA-256(challengeCode + verificationToken + endpointURL)
  const hash = crypto
    .createHash("sha256")
    .update(challengeCode + VERIFICATION_TOKEN + ENDPOINT_URL)
    .digest("hex");

  return NextResponse.json(
    { challengeResponse: hash },
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// POST: eBay sends account deletion/closure notifications
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log for audit (Poke-Trade doesn't store eBay user data,
    // but we acknowledge the notification as required)
    console.log("[eBay Account Deletion]", JSON.stringify({
      timestamp: new Date().toISOString(),
      topic: body?.metadata?.topic,
      userId: body?.notification?.data?.userId,
    }));

    // Acknowledge receipt
    return NextResponse.json({ status: "acknowledged" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "acknowledged" }, { status: 200 });
  }
}
