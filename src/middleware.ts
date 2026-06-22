import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── In-middleware rate limiter (lightweight, edge-compatible) ──
// We duplicate a simple counter here because the full rate-limit.ts
// uses Node APIs. Edge middleware needs its own minimal store.
const edgeRateStore = new Map<string, { count: number; resetAt: number }>();

function edgeRateLimit(ip: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let entry = edgeRateStore.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    edgeRateStore.set(ip, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}

// Prune stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of edgeRateStore) {
      if (now > entry.resetAt) edgeRateStore.delete(key);
    }
  }, 60_000);
}

// ── Suspicious user-agent patterns ──
const BLOCKED_UA_PATTERNS = [
  /^$/,                     // empty
  /python-requests/i,
  /python-urllib/i,
  /curl\//i,
  /wget\//i,
  /scrapy/i,
  /httpclient/i,
  /java\//i,
  /libwww/i,
  /Go-http-client/i,
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const userAgent = request.headers.get("user-agent") || "";

  // ── Block suspicious user agents on API routes ──
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
    // Allow empty UA check — block bots with no UA
    if (!userAgent) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Block known bot/scraper UAs (except on webhook endpoints)
    for (const pattern of BLOCKED_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }
  }

  // ── Rate limiting for API routes ──
  if (pathname.startsWith("/api/")) {
    // Skip rate limiting for webhooks (they have their own verification)
    if (!pathname.startsWith("/api/webhooks/")) {
      // Determine tier based on route
      let limit = 30;  // default: api tier
      let windowMs = 60_000;

      if (pathname.startsWith("/api/auth/")) {
        limit = 5;
        windowMs = 60_000;
      } else if (pathname.startsWith("/api/checkout")) {
        limit = 3;
        windowMs = 60_000;
      }

      const rl = edgeRateLimit(`${pathname}:${ip}`, limit, windowMs);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: { "Retry-After": String(rl.retryAfter) },
          }
        );
      }
    }
  }

  // ── CSRF protection for state-changing API requests ──
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/webhooks/") &&
    !pathname.startsWith("/api/auth/callback") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // If origin is present, validate it matches host
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const expectedHost = host?.split(":")[0];
        if (originUrl.hostname !== expectedHost && originUrl.hostname !== "localhost") {
          return NextResponse.json(
            { error: "Invalid origin" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid origin" },
          { status: 403 }
        );
      }
    }
  }

  // ── Request size limit check (Content-Length header) ──
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength);
      // 1MB limit for regular API routes
      if (size > 1_048_576) {
        return NextResponse.json(
          { error: "Request too large" },
          { status: 413 }
        );
      }
    }
  }

  // ── Supabase session update (existing auth middleware) ──
  const response = await updateSession(request);

  // ── Add security headers to all responses ──
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
