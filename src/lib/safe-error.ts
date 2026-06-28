/**
 * Standardized error response utility
 * Prevents leaking internal details to clients
 */
import { NextResponse } from "next/server";

export type ErrorCode =
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "PAYMENT_ERROR"
  | "AI_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "QUOTA_EXCEEDED";

interface SafeErrorOptions {
  status?: number;
  code?: ErrorCode;
  suggestion?: string;
}

/**
 * Return a safe, user-friendly error response.
 * Logs the real error server-side, returns sanitized message to client.
 */
export function safeError(
  error: unknown,
  userMessage = "Something went wrong. Please try again.",
  options: SafeErrorOptions = {}
): NextResponse {
  const { status = 500, code = "INTERNAL_ERROR", suggestion } = options;
  const requestId = generateRequestId();

  // Log real error server-side (with request ID for correlation)
  console.error(`[${requestId}] ${code}:`, error instanceof Error ? error.message : error);

  return NextResponse.json(
    {
      error: userMessage,
      code,
      requestId,
      ...(suggestion ? { suggestion } : {}),
    },
    { status }
  );
}

/**
 * Common error shortcuts
 */
export const errors = {
  unauthorized: (msg = "Please sign in to continue.") =>
    safeError(null, msg, { status: 401, code: "UNAUTHORIZED" }),

  forbidden: (msg = "You don't have permission to do this.") =>
    safeError(null, msg, { status: 403, code: "FORBIDDEN" }),

  notFound: (msg = "The requested resource was not found.") =>
    safeError(null, msg, { status: 404, code: "NOT_FOUND" }),

  rateLimited: (retryAfterSeconds?: number) =>
    safeError(null, "Too many requests. Please slow down.", {
      status: 429,
      code: "RATE_LIMITED",
      suggestion: retryAfterSeconds ? `Try again in ${retryAfterSeconds} seconds.` : undefined,
    }),

  validation: (msg: string) =>
    safeError(null, msg, { status: 400, code: "VALIDATION_ERROR" }),

  quotaExceeded: (msg = "You've reached your daily limit for this feature.") =>
    safeError(null, msg, { status: 429, code: "QUOTA_EXCEEDED", suggestion: "Upgrade your plan or try again tomorrow." }),

  ai: (error: unknown) =>
    safeError(error, "AI processing failed. Please try again.", { status: 502, code: "AI_ERROR" }),

  payment: (error: unknown) =>
    safeError(error, "Payment processing failed. Please try again or use a different payment method.", { status: 502, code: "PAYMENT_ERROR" }),
};

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
