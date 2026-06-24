/**
 * Enterprise security utilities — rate limiting, CSRF, sanitization, audit logging.
 */

import { createClient } from "@supabase/supabase-js";

// ── In-memory rate limiter ──

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Prune expired entries every 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 60_000);
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(identifier, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterMs: 0,
  };
}

// ── CSRF validation ──

export function validateCSRFToken(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) return true; // No origin = same-origin request

  try {
    const originUrl = new URL(origin);
    const expectedHost = host?.split(":")[0];
    return (
      originUrl.hostname === expectedHost ||
      originUrl.hostname === "localhost"
    );
  } catch {
    return false;
  }
}

// ── Input sanitization ──

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Sanitize user input — strip HTML tags and encode entities.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  // Strip HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Encode special characters
  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] || char);

  return sanitized.trim();
}

/**
 * Deep sanitize all string values in an object.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return sanitized;
}

// ── Audit logging ──

let _serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _serviceClient;
}

export interface AuditEventDetails {
  [key: string]: unknown;
}

/**
 * Log an audit event to the database.
 * Fire-and-forget — does not block the request.
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  details: AuditEventDetails = {},
  request?: Request
): Promise<void> {
  try {
    const supabase = getServiceClient();

    const ip = request
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
      : null;

    const userAgent = request
      ? request.headers.get("user-agent") || null
      : null;

    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      details,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (err) {
    // Never let audit logging crash a request
    console.error("[audit] Failed to log event:", err);
  }
}

/**
 * Log a rate limit violation for monitoring.
 */
export async function logRateLimitViolation(
  ipAddress: string,
  endpoint: string
): Promise<void> {
  try {
    const supabase = getServiceClient();
    await supabase.from("rate_limit_violations").insert({
      ip_address: ipAddress,
      endpoint,
    });
  } catch (err) {
    console.error("[security] Failed to log rate limit violation:", err);
  }
}
