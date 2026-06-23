/**
 * Poké-Trade Protection Program
 *
 * IMPORTANT: This is a platform service providing discretionary assistance.
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
    ],
    maxCredit: 0,
    priorityReview: false,
    dedicatedSupport: false,
    description:
      "Basic dispute support through the Dispute Resolution Center. File disputes, submit evidence, and receive standard review.",
  },
  pro: {
    tier: "pro",
    name: "Pro Protection",
    benefits: [
      "Priority dispute review (2-3 business days)",
      "Up to $100 in discretionary platform credits per incident (subject to investigation)",
      "Enhanced evidence review",
      "Access to Dispute Resolution Center",
    ],
    maxCredit: 100,
    priorityReview: true,
    dedicatedSupport: false,
    description:
      "Priority dispute review with eligibility for up to $100 in discretionary platform credits per qualifying incident. All credits are subject to investigation and are not guaranteed.",
  },
  elite: {
    tier: "elite",
    name: "Elite Protection",
    benefits: [
      "Priority dispute review (1-2 business days)",
      "Up to $250 in discretionary platform credits per incident (subject to investigation)",
      "Dedicated support representative",
      "Enhanced evidence review",
      "Access to Dispute Resolution Center",
    ],
    maxCredit: 250,
    priorityReview: true,
    dedicatedSupport: true,
    description:
      "Our highest level of discretionary protection. Priority review, dedicated support, and eligibility for up to $250 in platform credits per qualifying incident. All credits are subject to investigation and are not guaranteed.",
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

/** Standard disclaimer text. */
export const PROTECTION_DISCLAIMER =
  "The Poké-Trade Protection Program is a platform service, not insurance. Benefits are discretionary and subject to review. Platform credits are maximums, not guaranteed amounts. All claims are investigated individually. Poké-Trade reserves the right to deny or limit benefits based on investigation findings.";

/** Short disclaimer for banners. */
export const PROTECTION_DISCLAIMER_SHORT =
  "Protection Program benefits are discretionary and subject to review.";
