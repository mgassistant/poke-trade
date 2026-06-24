/**
 * Stripe Connect utility functions for marketplace seller payouts.
 * Uses Express accounts — simplest for marketplace model.
 */

import { stripe } from "@/lib/stripe";

/**
 * Create a Stripe Connect Express account for a seller.
 */
export async function createConnectAccount(
  userId: string,
  email: string,
  metadata?: Record<string, string>
) {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    metadata: {
      supabase_user_id: userId,
      ...metadata,
    },
    capabilities: {
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Generate an onboarding link for a Connect account.
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl?: string
) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl || returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink;
}

/**
 * Generate a login link so the seller can access their Stripe dashboard.
 */
export async function createLoginLink(accountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink;
}

/**
 * Retrieve full account status from Stripe.
 */
export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    id: account.id,
    onboarded: account.details_submitted ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
    charges_enabled: account.charges_enabled ?? false,
    details_submitted: account.details_submitted ?? false,
    requirements: account.requirements,
  };
}

/**
 * Retrieve balance for a connected account.
 */
export async function getAccountBalance(accountId: string) {
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  });

  const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
  const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

  return { available, pending };
}

/**
 * Trigger a manual payout to a connected account's bank.
 */
export async function createPayout(
  accountId: string,
  amountCents: number,
  currency = "usd"
) {
  const payout = await stripe.payouts.create(
    {
      amount: amountCents,
      currency,
    },
    { stripeAccount: accountId }
  );

  return payout;
}

/**
 * Calculate platform fee based on seller's membership tier.
 * Free: 5%, Pro/Elite: 3%
 */
export function calculatePlatformFee(
  amountCents: number,
  sellerTier: string
): number {
  const rate = sellerTier === "free" ? 0.05 : 0.03;
  return Math.round(amountCents * rate);
}
