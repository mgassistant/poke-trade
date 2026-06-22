/**
 * In-memory rate limiter — no external dependencies.
 * Tracks requests by a composite key (IP + userId).
 * Automatically prunes expired entries every 60s.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, RateLimitEntry>();

// Prune expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

export type RateLimitTier = "auth" | "api" | "webhook" | "checkout" | "signup";

const TIER_CONFIG: Record<RateLimitTier, { maxRequests: number; windowMs: number }> = {
  auth: { maxRequests: 5, windowMs: 60_000 },        // 5/min
  api: { maxRequests: 30, windowMs: 60_000 },         // 30/min
  webhook: { maxRequests: 100, windowMs: 60_000 },    // 100/min
  checkout: { maxRequests: 3, windowMs: 60_000 },     // 3/min
  signup: { maxRequests: 3, windowMs: 3_600_000 },    // 3/hour
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

/**
 * Check and consume a rate-limit token.
 * @param key   Composite identifier, e.g. `${ip}:${userId}`
 * @param tier  Which rate-limit tier to apply
 */
export function checkRateLimit(key: string, tier: RateLimitTier): RateLimitResult {
  const config = TIER_CONFIG[tier];
  const now = Date.now();
  const compositeKey = `${tier}:${key}`;

  let entry = store.get(compositeKey);

  // Window expired — reset
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(compositeKey, entry);
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      limit: config.maxRequests,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    retryAfterSeconds: 0,
    limit: config.maxRequests,
  };
}

/**
 * Extract the best-effort client IP from headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Build a rate-limit key from IP and optional user ID.
 */
export function rateLimitKey(ip: string, userId?: string): string {
  return userId ? `${ip}:${userId}` : ip;
}
