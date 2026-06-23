/**
 * Secure Trade fee calculation and trade protection utilities
 */

export interface FeeBreakdown {
  totalFee: number;
  perParty: number;
  tradeValue: number;
  method: 'flat' | 'percentage';
}

/**
 * Calculate Secure Trade (Verified) fee based on trade value.
 * - Under $50: flat $5.99
 * - $50+: 3% of total trade value
 * - Whichever is HIGHER (minimum $5.99)
 * - Split 50/50 between parties
 */
export function calculateSecureTradeFee(tradeValue: number): FeeBreakdown {
  const flatFee = 5.99;
  const percentageFee = tradeValue * 0.03;
  const totalFee = Math.max(flatFee, percentageFee);
  const method = percentageFee > flatFee ? 'percentage' : 'flat';

  return {
    totalFee: Math.round(totalFee * 100) / 100,
    perParty: Math.round((totalFee / 2) * 100) / 100,
    tradeValue,
    method,
  };
}

export type MembershipTier = 'free' | 'pro' | 'elite';

export interface ProtectionInfo {
  guaranteeAmount: number;
  source: 'membership' | 'secure_trade' | 'addon' | 'none';
  addonAvailable: boolean;
  addonCost: number;
  addonCoverage: number;
}

/**
 * Get trade protection details based on membership tier and shipping method.
 */
export function getTradeProtection(
  tier: MembershipTier,
  shippingMethod: 'direct' | 'verified'
): ProtectionInfo {
  // Secure Trade always includes $50 guarantee
  if (shippingMethod === 'verified') {
    return {
      guaranteeAmount: 50,
      source: 'secure_trade',
      addonAvailable: true,
      addonCost: 2.99,
      addonCoverage: 500,
    };
  }

  // Direct Ship — depends on membership
  if (tier === 'elite') {
    return {
      guaranteeAmount: 100,
      source: 'membership',
      addonAvailable: true,
      addonCost: 2.99,
      addonCoverage: 500,
    };
  }

  if (tier === 'pro') {
    return {
      guaranteeAmount: 50,
      source: 'membership',
      addonAvailable: true,
      addonCost: 2.99,
      addonCoverage: 500,
    };
  }

  // Free tier + Direct Ship = no guarantee
  return {
    guaranteeAmount: 0,
    source: 'none',
    addonAvailable: true,
    addonCost: 2.99,
    addonCoverage: 500,
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
