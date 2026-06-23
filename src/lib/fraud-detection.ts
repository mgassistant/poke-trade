/**
 * Poké-Trade Fraud Detection & Risk Scoring Engine
 *
 * Evaluates listings and users for suspicious activity.
 * Score range: 0-100 (higher = more risky).
 */

export type RiskLevel = "low" | "medium" | "high";

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  flags: string[];
  recommended_actions: string[];
}

export interface ListingForRisk {
  id: string;
  price: number;
  photos: string[];
  created_at: string;
  card_market_value?: number | null;
}

export interface SellerForRisk {
  id: string;
  created_at: string;
  verification_level: number;
  trust_score: number;
  total_trades: number;
  total_sales: number;
  dispute_count: number;
  recent_listing_count: number; // listings created in last hour
}

/**
 * Determine risk level from score.
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}

/**
 * Calculate risk score for a listing + seller combination.
 */
export function calculateListingRisk(
  listing: ListingForRisk,
  seller: SellerForRisk
): RiskAssessment {
  let score = 0;
  const flags: string[] = [];
  const recommended_actions: string[] = [];

  // New account (< 7 days): +20
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(seller.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (accountAgeDays < 7) {
    score += 20;
    flags.push(`New account (${accountAgeDays} days old)`);
  }

  // No verification: +15
  if (seller.verification_level === 0) {
    score += 15;
    flags.push("No identity verification");
  }

  // High value listing (> $500): +10
  if (listing.price > 500) {
    score += 10;
    flags.push(`High value listing ($${listing.price.toFixed(2)})`);
  }

  // Price significantly below market (< 50% TCGPlayer): +25
  if (listing.card_market_value && listing.card_market_value > 0) {
    const ratio = listing.price / listing.card_market_value;
    if (ratio < 0.5) {
      score += 25;
      flags.push(
        `Price ${Math.round(ratio * 100)}% of market value ($${listing.price.toFixed(2)} vs $${listing.card_market_value.toFixed(2)})`
      );
    }
  }

  // Multiple listings in 1 hour: +15
  if (seller.recent_listing_count > 5) {
    score += 15;
    flags.push(`${seller.recent_listing_count} listings in the last hour`);
  }

  // Previous disputes: +10 per dispute
  if (seller.dispute_count > 0) {
    const disputePenalty = Math.min(seller.dispute_count * 10, 30);
    score += disputePenalty;
    flags.push(`${seller.dispute_count} previous dispute(s)`);
  }

  // Low trust score (< 300): +15
  if (seller.trust_score < 300) {
    score += 15;
    flags.push(`Low trust score (${seller.trust_score})`);
  }

  // Stock photos detected (no unique images): +10
  if (!listing.photos || listing.photos.length === 0) {
    score += 10;
    flags.push("No photos uploaded (stock images only)");
  }

  // Cap at 100
  score = Math.min(score, 100);

  const level = getRiskLevel(score);

  // Generate recommended actions
  if (level === "high") {
    recommended_actions.push("Flag for admin review");
    recommended_actions.push("Require additional verification");
    if (listing.price > 100) {
      recommended_actions.push("Require front and back photos");
    }
  } else if (level === "medium") {
    recommended_actions.push("Monitor activity");
    if (seller.verification_level === 0) {
      recommended_actions.push("Suggest identity verification");
    }
  }

  return { score, level, flags, recommended_actions };
}

/**
 * Calculate risk assessment for a trade partner.
 */
export function calculateTradePartnerRisk(partner: SellerForRisk): RiskAssessment {
  let score = 0;
  const flags: string[] = [];
  const recommended_actions: string[] = [];

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(partner.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (accountAgeDays < 7) {
    score += 25;
    flags.push(`New account (${accountAgeDays} days old)`);
  }

  if (partner.verification_level === 0) {
    score += 15;
    flags.push("No identity verification");
  }

  if (partner.dispute_count > 0) {
    score += Math.min(partner.dispute_count * 10, 30);
    flags.push(`${partner.dispute_count} previous dispute(s)`);
  }

  if (partner.trust_score < 300) {
    score += 20;
    flags.push(`Low trust score (${partner.trust_score})`);
  }

  if (partner.total_trades === 0 && partner.total_sales === 0) {
    score += 10;
    flags.push("No completed trades or sales");
  }

  score = Math.min(score, 100);
  const level = getRiskLevel(score);

  if (level === "high") {
    recommended_actions.push("Consider using verified shipping");
    recommended_actions.push("Add trade protection");
  } else if (level === "medium") {
    recommended_actions.push("Use verified shipping for valuable items");
  }

  return { score, level, flags, recommended_actions };
}

/**
 * Get risk badge color classes for UI display.
 */
export function getRiskBadgeColors(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (level) {
    case "high":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: "🔴",
      };
    case "medium":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: "🟡",
      };
    case "low":
    default:
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: "🟢",
      };
  }
}
