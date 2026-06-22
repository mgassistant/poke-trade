/**
 * Auth security helpers — account lockout, failed-attempt tracking.
 * Uses Supabase service client for server-side operations.
 */

import { createClient } from "@supabase/supabase-js";

const LOCKOUT_THRESHOLD = 5;       // failed attempts before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MIN_ACCOUNT_AGE_HOURS = 24;  // for first purchase

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface LockoutStatus {
  locked: boolean;
  remainingMinutes: number;
  failedAttempts: number;
}

/**
 * Check if an account is locked out.
 * Stores attempts in profiles.metadata JSON column.
 * Falls back gracefully if metadata column doesn't exist.
 */
export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
  const supabase = getServiceClient();

  // Look up user by email via auth admin
  const { data: userList } = await supabase.auth.admin.listUsers();
  const user = userList?.users?.find((u) => u.email === email);

  if (!user) {
    return { locked: false, remainingMinutes: 0, failedAttempts: 0 };
  }

  const meta = (user.user_metadata?.security as Record<string, unknown>) || {};
  const failedAttempts = (meta.failed_login_attempts as number) || 0;
  const lockedUntil = (meta.locked_until as number) || 0;

  if (lockedUntil && Date.now() < lockedUntil) {
    const remainingMinutes = Math.ceil((lockedUntil - Date.now()) / 60_000);
    return { locked: true, remainingMinutes, failedAttempts };
  }

  // If lockout expired, reset
  if (lockedUntil && Date.now() >= lockedUntil) {
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        security: { failed_login_attempts: 0, locked_until: 0 },
      },
    });
    return { locked: false, remainingMinutes: 0, failedAttempts: 0 };
  }

  return { locked: false, remainingMinutes: 0, failedAttempts };
}

/**
 * Record a failed login attempt. Locks the account after LOCKOUT_THRESHOLD.
 */
export async function recordFailedLogin(email: string): Promise<LockoutStatus> {
  const supabase = getServiceClient();

  const { data: userList } = await supabase.auth.admin.listUsers();
  const user = userList?.users?.find((u) => u.email === email);

  if (!user) {
    return { locked: false, remainingMinutes: 0, failedAttempts: 0 };
  }

  const meta = (user.user_metadata?.security as Record<string, unknown>) || {};
  const current = ((meta.failed_login_attempts as number) || 0) + 1;

  const shouldLock = current >= LOCKOUT_THRESHOLD;
  const lockedUntil = shouldLock ? Date.now() + LOCKOUT_DURATION_MS : 0;

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      security: {
        failed_login_attempts: current,
        locked_until: lockedUntil,
        last_failed_at: Date.now(),
      },
    },
  });

  return {
    locked: shouldLock,
    remainingMinutes: shouldLock ? Math.ceil(LOCKOUT_DURATION_MS / 60_000) : 0,
    failedAttempts: current,
  };
}

/**
 * Clear failed login attempts on successful login.
 */
export async function clearFailedLogins(userId: string): Promise<void> {
  const supabase = getServiceClient();

  const { data } = await supabase.auth.admin.getUserById(userId);
  if (!data?.user) return;

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...data.user.user_metadata,
      security: { failed_login_attempts: 0, locked_until: 0 },
    },
  });
}

/**
 * Check if a user account meets the minimum age requirement for checkout.
 */
export function checkAccountAge(createdAt: string): {
  eligible: boolean;
  hoursOld: number;
  requiredHours: number;
} {
  const created = new Date(createdAt).getTime();
  const hoursOld = (Date.now() - created) / (1000 * 60 * 60);
  return {
    eligible: hoursOld >= MIN_ACCOUNT_AGE_HOURS,
    hoursOld: Math.floor(hoursOld),
    requiredHours: MIN_ACCOUNT_AGE_HOURS,
  };
}

/**
 * Evaluate password strength (0-4 score).
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  score = Math.min(score, 4);

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Strong", color: "bg-green-400" },
    4: { label: "Very Strong", color: "bg-green-600" },
  };

  return { score, ...labels[score] };
}
