/**
 * Poké-Trade Protection Program
 *
 * IMPORTANT: Poké-Trade is an online marketplace. It does NOT buy, sell, inspect,
 * authenticate, grade, store, ship, or take possession of any traded items.
 * All items are shipped directly between users.
 *
 * Trade Protection is an optional platform benefit for eligible trades only.
 * It is NOT insurance. It is NOT a guarantee. All benefits are subject to
 * investigation and review. Dollar amounts are MAXIMUMS, not guaranteed payouts.
 */

export type MembershipTier = "free" | "pro" | "elite";

export interface ProtectionTier {
  tier: MembershipTier;
  name: string;
  benefits: string[];
  maxCredit: number;
  priorityReview: boolean;
  dedicatedSupport: boolean;
  description: string;
}

export interface ProtectionEligibility {
  eligible: boolean;
  requirements: {
    key: string;
    label: string;
    met: boolean;
    detail: string;
  }[];
}

const PROTECTION_TIERS: Record<MembershipTier, ProtectionTier> = {
  free: {
    tier: "free",
    name: "Basic Protection",
    benefits: [
      "Basic dispute support",
      "Standard review timeline (5-7 business days)",
      "Access to Dispute Resolution Center",
      "Direct shipping between users",
    ],
    maxCredit: 0,
    priorityReview: false,
    dedicatedSupport: false,
    description:
      "Basic dispute support through the Dispute Resolution Center. All trades are shipped directly between users. No platform protection benefit included.",
  },
  pro: {
    tier: "pro",
    name: "Pro Protection",
    benefits: [
      "Priority dispute review (2-3 business days)",
      "Up to $50 in discretionary platform credits per incident (subject to investigation)",
      "Direct shipping between users with payment authorization hold",
      "Enhanced evidence review",
      "Access to Dispute Resolution Center",
    ],
    maxCredit: 50,
    priorityReview: true,
    dedicatedSupport: false,
    description:
      "Priority dispute review with eligibility for up to $50 in discretionary platform credits per qualifying incident. All trades are shipped directly between users with secure payment authorization. All credits are subject to investigation and are not guaranteed.",
  },
  elite: {
    tier: "elite",
    name: "Elite Protection",
    benefits: [
      "Priority dispute review (1-2 business days)",
      "Up to $100 in discretionary platform credits per incident (subject to investigation)",
      "Direct shipping between users with payment authorization hold",
      "Dedicated support representative",
      "Enhanced evidence review",
      "Access to Dispute Resolution Center",
    ],
    maxCredit: 100,
    priorityReview: true,
    dedicatedSupport: true,
    description:
      "Our highest level of discretionary protection. Priority review, dedicated support, and eligibility for up to $100 in platform credits per qualifying incident. All trades are shipped directly between users with secure payment authorization. All credits are subject to investigation and are not guaranteed.",
  },
};

/**
 * Get the protection tier details for a given membership level.
 */
export function getProtectionTier(membershipTier: MembershipTier): ProtectionTier {
  return PROTECTION_TIERS[membershipTier] ?? PROTECTION_TIERS.free;
}

/**
 * Check if a user/trade combination is eligible for Protection Program benefits.
 *
 * Eligibility requirements:
 * 1. Account must be verified (verification_level >= 1)
 * 2. Trust Score must be 300+ ("Trusted" tier or above)
 * 3. Trade must be documented (photos, descriptions)
 * 4. Shipping must be tracked (tracking number provided)
 *
 * Meeting eligibility does NOT guarantee benefits — all claims are subject
 * to investigation and discretionary review.
 */
export function isEligibleForProtection(
  trade: {
    documentation_complete?: boolean;
    tracking_number?: string | null;
    shipping_tracked?: boolean;
  } | null,
  user: {
    verification_level?: number;
    trust_score?: number;
  } | null
): ProtectionEligibility {
  const requirements = [
    {
      key: "verified_account",
      label: "Verified Account",
      met: (user?.verification_level ?? 0) >= 1,
      detail:
        (user?.verification_level ?? 0) >= 1
          ? "Your account is verified"
          : "Account verification required (Level 1+)",
    },
    {
      key: "trust_score",
      label: "Trust Score 300+",
      met: (user?.trust_score ?? 0) >= 300,
      detail:
        (user?.trust_score ?? 0) >= 300
          ? `Trust Score: ${user?.trust_score ?? 0}`
          : `Current Trust Score: ${user?.trust_score ?? 0}. Minimum 300 required.`,
    },
    {
      key: "trade_documented",
      label: "Trade Documented",
      met: trade?.documentation_complete === true,
      detail: trade?.documentation_complete
        ? "Trade has complete documentation"
        : "Trade must have photos and descriptions on file",
    },
    {
      key: "shipping_tracked",
      label: "Shipping Tracked",
      met: !!(trade?.tracking_number || trade?.shipping_tracked),
      detail:
        trade?.tracking_number || trade?.shipping_tracked
          ? "Shipping tracking is active"
          : "A valid tracking number is required",
    },
  ];

  return {
    eligible: requirements.every((r) => r.met),
    requirements,
  };
}

/**
 * All protection tiers for display purposes.
 */
export function getAllProtectionTiers(): ProtectionTier[] {
  return [PROTECTION_TIERS.free, PROTECTION_TIERS.pro, PROTECTION_TIERS.elite];
}

/** Standard disclaimer text — the full legal disclosure. */
export const PROTECTION_DISCLAIMER =
  "By selecting Trade Protection, I understand and agree that Poké-Trade is an online marketplace and does not buy, sell, inspect, authenticate, grade, store, ship, or take possession of any traded items. All items are shipped directly between users.\n\nTrade Protection is an optional platform benefit for eligible trades only. Eligibility requires full compliance with Poké-Trade procedures, including accurate declared values, required photos, valid tracking, delivery confirmation, payment authorization, and timely dispute submission.\n\nProtection benefits are limited and may be provided as platform credit, reimbursement, or another remedy determined by Poké-Trade in its reasonable discretion, up to the applicable membership limit. Trade Protection does not guarantee reimbursement and does not make Poké-Trade responsible for user conduct, counterfeit items, shipping issues, inaccurate values, fraud, or off-platform activity.\n\nPoké-Trade may deny claims involving fraud, abuse, missing evidence, inaccurate values, prohibited items, failure to follow required procedures, or violations of the Terms of Service. Payment authorizations may be released, adjusted, or captured only as permitted by the Trade Protection Terms, payment processor rules, and applicable law.";

/** Short disclaimer for banners. */
export const PROTECTION_DISCLAIMER_SHORT =
  "Trade Protection benefits are discretionary and subject to review. Poké-Trade does not take possession of any traded items.";
