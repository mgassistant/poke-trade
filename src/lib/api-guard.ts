/**
 * Reusable API route protection wrapper.
 * Enforces auth, rate limiting, input validation, and error sanitization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitKey, type RateLimitTier } from "@/lib/rate-limit";

export interface GuardedContext {
  userId: string;
  email: string;
  ip: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

interface GuardOptions {
  /** Rate limit tier (default: "api") */
  tier?: RateLimitTier;
  /** Require authenticated user (default: true) */
  requireAuth?: boolean;
  /** Max request body size in bytes (default: 100KB) */
  maxBodySize?: number;
  /** Validate and parse JSON body */
  parseBody?: boolean;
}

type RouteHandler = (
  request: NextRequest,
  context: GuardedContext
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with security guards.
 *
 * @example
 * export const POST = guardedRoute(async (req, ctx) => {
 *   // ctx.userId, ctx.body are validated
 *   return NextResponse.json({ ok: true });
 * }, { tier: "api", parseBody: true });
 */
export function guardedRoute(
  handler: RouteHandler,
  options: GuardOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    tier = "api",
    requireAuth = true,
    maxBodySize = 102_400, // 100KB
    parseBody = false,
  } = options;

  return async (request: NextRequest) => {
    try {
      const ip = getClientIp(request.headers);

      // --- Rate limiting ---
      const rlKey = rateLimitKey(ip);
      const rl = checkRateLimit(rlKey, tier);

      if (!rl.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(rl.retryAfterSeconds),
              "X-RateLimit-Limit": String(rl.limit),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

      // --- Auth check ---
      let userId = "";
      let email = "";

      if (requireAuth) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }

        userId = user.id;
        email = user.email || "";

        // Re-check rate limit with user-specific key
        const userRl = checkRateLimit(rateLimitKey(ip, userId), tier);
        if (!userRl.allowed) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": String(userRl.retryAfterSeconds),
              },
            }
          );
        }
      }

      // --- Body parsing + size check ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any = null;

      if (parseBody && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > maxBodySize) {
          return NextResponse.json(
            { error: "Request body too large" },
            { status: 413 }
          );
        }

        try {
          const text = await request.text();
          if (text.length > maxBodySize) {
            return NextResponse.json(
              { error: "Request body too large" },
              { status: 413 }
            );
          }
          body = JSON.parse(text);
        } catch {
          return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
          );
        }
      }

      // --- Execute handler ---
      const context: GuardedContext = { userId, email, ip, body };
      return await handler(request, context);
    } catch (error) {
      // Sanitize — never leak internal errors
      console.error("[api-guard] Unhandled error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple input validation helper.
 * Returns null if valid, or an error message string.
 */
export function validateInput(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  rules: Record<string, { required?: boolean; type?: string; maxLength?: number; min?: number; max?: number }>
): string | null {
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (rule.required && (value === undefined || value === null || value === "")) {
      return `${field} is required`;
    }

    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        return `${field} must be a ${rule.type}`;
      }

      if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
        return `${field} exceeds maximum length of ${rule.maxLength}`;
      }

      if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
        return `${field} must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && typeof value === "number" && value > rule.max) {
        return `${field} must be at most ${rule.max}`;
      }
    }
  }

  return null;
}
