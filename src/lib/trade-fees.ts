/**
 * Trade Protection fee calculation and trade protection utilities.
 *
 * Poké-Trade is an online marketplace. It does NOT buy, sell, inspect,
 * authenticate, grade, store, ship, or take possession of any traded items.
 * All items are shipped directly between users.
 */

export type MembershipTier = 'free' | 'pro' | 'elite';
export type ShippingMethod = 'direct' | 'protected';
export type AuthorizationStatus = 'none' | 'pending' | 'authorized' | 'captured' | 'released' | 'failed';

export interface ProtectionConfig {
  tier: MembershipTier;
  feeMinimum: number;
  feeRate: number;
  maxProtectionBenefit: number;
}

export const PROTECTION_CONFIGS: Record<MembershipTier, ProtectionConfig> = {
  free: {
    tier: 'free',
    feeMinimum: 5.99,
    feeRate: 0.05,
    maxProtectionBenefit: 0,
  },
  pro: {
    tier: 'pro',
    feeMinimum: 3.99,
    feeRate: 0.03,
    maxProtectionBenefit: 50,
  },
  elite: {
    tier: 'elite',
    feeMinimum: 3.99,
    feeRate: 0.03,
    maxProtectionBenefit: 100,
  },
};

export interface FeeBreakdown {
  totalFee: number;
  perParty: number;
  tradeValue: number;
  method: 'flat' | 'percentage';
  feeMinimum: number;
  feeRate: number;
  maxProtectionBenefit: number;
  tier: MembershipTier;
}

/**
 * Calculate Trade Protection fee based on the higher-tier party and trade value.
 *
 * - Free: $5.99 OR 5% (whichever higher), split 50/50. No protection benefit.
 * - Pro:  $3.99 OR 3% (whichever higher), split 50/50. Up to $50 protection.
 * - Elite: $3.99 OR 3% (whichever higher), split 50/50. Up to $100 protection.
 */
export function calculateProtectionFee(tradeValue: number, tier: MembershipTier): FeeBreakdown {
  const config = PROTECTION_CONFIGS[tier];
  const percentageFee = tradeValue * config.feeRate;
  const totalFee = Math.max(config.feeMinimum, percentageFee);
  const method = percentageFee > config.feeMinimum ? 'percentage' : 'flat';

  return {
    totalFee: Math.round(totalFee * 100) / 100,
    perParty: Math.round((totalFee / 2) * 100) / 100,
    tradeValue,
    method,
    feeMinimum: config.feeMinimum,
    feeRate: config.feeRate,
    maxProtectionBenefit: config.maxProtectionBenefit,
    tier,
  };
}

/**
 * Determine the effective tier for fee calculation.
 * Uses the higher tier between sender and receiver.
 */
export function getEffectiveTier(senderTier: MembershipTier, receiverTier: MembershipTier): MembershipTier {
  const tierOrder: MembershipTier[] = ['free', 'pro', 'elite'];
  const senderIdx = tierOrder.indexOf(senderTier);
  const receiverIdx = tierOrder.indexOf(receiverTier);
  return tierOrder[Math.max(senderIdx, receiverIdx)];
}

export interface ProtectionInfo {
  /** Maximum eligible discretionary platform credit, subject to review */
  maxEligibleCredit: number;
  source: 'membership' | 'none';
}

/**
 * Get trade protection details based on membership tier.
 * All trades are direct-ship between users. Protection benefits come from membership tier.
 */
export function getTradeProtection(
  tier: MembershipTier,
  shippingMethod: ShippingMethod
): ProtectionInfo {
  if (shippingMethod === 'protected') {
    const config = PROTECTION_CONFIGS[tier];
    return {
      maxEligibleCredit: config.maxProtectionBenefit,
      source: config.maxProtectionBenefit > 0 ? 'membership' : 'none',
    };
  }

  // Direct Ship — no protection
  return {
    maxEligibleCredit: 0,
    source: 'none',
  };
}

/**
 * Validate tracking number format
 */
export function validateTrackingNumber(trackingNumber: string, carrier: string): { valid: boolean; error?: string } {
  const cleaned = trackingNumber.replace(/\s/g, '').toUpperCase();

  switch (carrier) {
    case 'usps':
      // USPS: 20-22 digits or starts with 9
      if (/^9\d{15,21}$/.test(cleaned) || /^\d{20,22}$/.test(cleaned)) {
        return { valid: true };
      }
      return { valid: false, error: 'USPS tracking must be 20-22 digits or start with 9' };

    case 'ups':
      // UPS: 1Z followed by alphanumeric
      if (/^1Z[A-Z0-9]{16,18}$/.test(cleaned)) {
        return { valid: true };
      }
      return { valid: false, error: 'UPS tracking must start with 1Z followed by 16-18 characters' };

    case 'fedex':
      // FedEx: 12-15 digits
      if (/^\d{12,15}$/.test(cleaned)) {
        return { valid: true };
      }
      return { valid: false, error: 'FedEx tracking must be 12-15 digits' };

    default:
      // For DHL and other carriers, accept any non-empty string
      if (cleaned.length >= 5) {
        return { valid: true };
      }
      return { valid: false, error: 'Tracking number must be at least 5 characters' };
  }
}
