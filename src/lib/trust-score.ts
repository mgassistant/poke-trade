/**
 * Poké-Trade Trust Score™ calculation and utilities.
 *
 * Score range: 100–1000.
 * Discretionary metric — does not guarantee any outcome.
 */

export interface TrustScoreProfile {
  created_at: string;
  verification_level: number;
  total_trades: number;
  total_sales: number;
  average_rating: number;
  successful_deliveries: number;
  chargebacks: number;
  lost_disputes: number;
  community_reports: number;
}

export interface TrustScoreBreakdown {
  score: number;
  tier: TrustScoreTier;
  color: string;
  factors: {
    accountAge: number;
    verificationLevel: number;
    completedTrades: number;
    completedSales: number;
    averageRating: number;
    successfulDeliveries: number;
    deductions: number;
  };
}

export type TrustScoreTier = "Rookie" | "Trusted" | "Veteran" | "Elite" | "Master";

const BASE_SCORE = 100;
const MIN_SCORE = 100;
const MAX_SCORE = 1000;

/**
 * Calculate the Trust Score for a user profile.
 */
export function calculateTrustScore(profile: TrustScoreProfile): TrustScoreBreakdown {
  const now = Date.now();
  const createdAt = new Date(profile.created_at).getTime();
  const weeksOld = Math.floor((now - createdAt) / (7 * 24 * 60 * 60 * 1000));

  // Account age: 1 pt per week, max 100
  const accountAge = Math.min(weeksOld, 100);

  // Verification level: 50 pts per level (0-4), max 200
  const verificationLevel = Math.min(profile.verification_level, 4) * 50;

  // Completed trades: 5 pts per trade, max 150 (cap at 30 trades)
  const completedTrades = Math.min(profile.total_trades, 30) * 5;

  // Completed sales: 5 pts per sale, max 100 (cap at 20 sales)
  const completedSales = Math.min(profile.total_sales, 20) * 5;

  // Average review rating: rating * 30, max 150
  const averageRating = Math.min(Math.max(profile.average_rating, 0) * 30, 150);

  // Successful deliveries: 5 pts per delivery, max 100 (cap at 20)
  const successfulDeliveries = Math.min(profile.successful_deliveries, 20) * 5;

  // Deductions
  const chargebackPenalty = profile.chargebacks * 50;
  const disputePenalty = profile.lost_disputes * 30;
  const reportPenalty = profile.community_reports * 20;
  const deductions = chargebackPenalty + disputePenalty + reportPenalty;

  const rawScore =
    BASE_SCORE +
    accountAge +
    verificationLevel +
    completedTrades +
    completedSales +
    averageRating +
    successfulDeliveries -
    deductions;

  const score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(rawScore)));

  return {
    score,
    tier: getTrustScoreTier(score),
    color: getTrustScoreColor(score),
    factors: {
      accountAge,
      verificationLevel,
      completedTrades,
      completedSales,
      averageRating: Math.round(averageRating),
      successfulDeliveries,
      deductions,
    },
  };
}

/**
 * Get the tier label for a given trust score.
 */
export function getTrustScoreTier(score: number): TrustScoreTier {
  if (score >= 900) return "Master";
  if (score >= 700) return "Elite";
  if (score >= 500) return "Veteran";
  if (score >= 300) return "Trusted";
  return "Rookie";
}

/**
 * Get the Tailwind color class for a given trust score.
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 900) return "text-purple-600";
  if (score >= 700) return "text-amber-500";
  if (score >= 500) return "text-green-600";
  if (score >= 300) return "text-blue-600";
  return "text-gray-500";
}

/**
 * Get background color class for trust score badge.
 */
export function getTrustScoreBgColor(score: number): string {
  if (score >= 900) return "bg-purple-50 border-purple-200";
  if (score >= 700) return "bg-amber-50 border-amber-200";
  if (score >= 500) return "bg-green-50 border-green-200";
  if (score >= 300) return "bg-blue-50 border-blue-200";
  return "bg-gray-50 border-gray-200";
}
