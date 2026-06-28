import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = "Poké-Trade <notifications@updates.poke-trade.com>";
const ADMIN_EMAIL = "info@poke-trade.com";

function emailTemplate(title: string, body: string, ctaUrl?: string, ctaText?: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#dc2626,#2563eb);padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">⚡ Poké-Trade</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
          <h2 style="margin:0 0 16px;color:#111;font-size:20px;font-weight:600;">${title}</h2>
          <div style="color:#374151;font-size:15px;line-height:1.6;">${body}</div>
          ${ctaUrl ? `<div style="margin:24px 0;text-align:center;">
            <a href="${ctaUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${ctaText || "View on Poké-Trade"}</a>
          </div>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Poké-Trade. All rights reserved.</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">
            <a href="https://poke-trade.com" style="color:#9ca3af;">poke-trade.com</a> · 
            <a href="https://poke-trade.com/help" style="color:#9ca3af;">Help</a> · 
            <a href="https://poke-trade.com/privacy" style="color:#9ca3af;">Privacy</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[Email Skipped - No RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  } catch (err) {
    console.error(`[Email Error] To: ${to} | Subject: ${subject}`, err);
  }
}

// ── Public API ──────────────────────────────────────────────────────────

export async function sendAdminNotification(subject: string, body: string): Promise<void> {
  const html = emailTemplate(subject, body);
  await sendEmail(ADMIN_EMAIL, subject, html);
}

export async function sendUserNotification(
  to: string,
  subject: string,
  body: string,
  ctaUrl?: string,
  ctaText?: string
): Promise<void> {
  const html = emailTemplate(subject, body, ctaUrl, ctaText);
  await sendEmail(to, subject, html);
}

// ── Event-Specific Helpers (fire-and-forget) ────────────────────────────

export function notifyNewMember(username: string, email: string): void {
  sendAdminNotification(
    "🎉 New Member Joined",
    `<p><strong>${username}</strong> (${email}) just joined Poké-Trade!</p>`
  ).catch(() => {});

  sendUserNotification(
    email,
    "Welcome to Poké-Trade! 🎉",
    `<p>Hey ${username},</p>
     <p>Welcome to the Poké-Trade community! Here's how to get started:</p>
     <ul style="padding-left:20px;">
       <li><strong>Build your collection</strong> — Add cards to track their value</li>
       <li><strong>Browse the marketplace</strong> — Find cards you've been looking for</li>
       <li><strong>Start trading</strong> — Match with other collectors</li>
       <li><strong>Earn trust</strong> — Complete trades to build your reputation</li>
     </ul>
     <p>Happy collecting!</p>`,
    "https://poke-trade.com/dashboard",
    "Go to Dashboard"
  ).catch(() => {});
}

export function notifyNewTrade(
  senderName: string,
  receiverName: string,
  receiverEmail: string,
  senderEmail: string,
  tradeValue: number,
  tradeId: string
): void {
  sendAdminNotification(
    "🔄 New Trade Created",
    `<p><strong>${senderName}</strong> offered to trade with <strong>${receiverName}</strong></p>
     <p>Estimated value: <strong>$${tradeValue.toFixed(2)}</strong></p>`
  ).catch(() => {});

  const tradeUrl = `https://poke-trade.com/dashboard/trades/${tradeId}`;
  sendUserNotification(
    receiverEmail,
    "You have a new trade offer! 🔄",
    `<p><strong>${senderName}</strong> sent you a trade offer.</p>
     <p>Review the offer and respond to get the trade going!</p>`,
    tradeUrl,
    "View Trade Offer"
  ).catch(() => {});

  sendUserNotification(
    senderEmail,
    "Trade offer sent! 🔄",
    `<p>Your trade offer to <strong>${receiverName}</strong> has been submitted.</p>
     <p>You'll be notified when they respond.</p>`,
    tradeUrl,
    "View Trade"
  ).catch(() => {});
}

export function notifyTradeAccepted(
  user1Name: string,
  user2Name: string,
  user1Email: string,
  user2Email: string,
  tradeValue: number,
  tradeId: string
): void {
  sendAdminNotification(
    "✅ Trade Accepted",
    `<p><strong>${user1Name}</strong> ↔ <strong>${user2Name}</strong></p>
     <p>Value: <strong>$${tradeValue.toFixed(2)}</strong></p>`
  ).catch(() => {});

  const tradeUrl = `https://poke-trade.com/dashboard/trades/${tradeId}`;
  const body = `<p>Your trade has been accepted! 🎉</p>
     <p>Next steps: coordinate shipping details and complete the trade.</p>`;

  sendUserNotification(user1Email, "Trade Accepted! ✅", body, tradeUrl, "View Trade").catch(() => {});
  sendUserNotification(user2Email, "Trade Accepted! ✅", body, tradeUrl, "View Trade").catch(() => {});
}

export function notifyNewListing(cardName: string, sellerName: string, price: number): void {
  sendAdminNotification(
    "📦 New Listing Created",
    `<p><strong>${cardName}</strong> listed by <strong>${sellerName}</strong> for <strong>$${price.toFixed(2)}</strong></p>`
  ).catch(() => {});
}

export function notifyPurchase(
  buyerName: string,
  buyerEmail: string,
  sellerName: string,
  sellerEmail: string,
  cardName: string,
  price: number
): void {
  sendAdminNotification(
    "💰 Sale Completed",
    `<p><strong>${buyerName}</strong> purchased <strong>${cardName}</strong> from <strong>${sellerName}</strong> for <strong>$${price.toFixed(2)}</strong></p>`
  ).catch(() => {});

  sendUserNotification(
    buyerEmail,
    `Order Confirmed: ${cardName} 🛒`,
    `<p>Your purchase of <strong>${cardName}</strong> for <strong>$${price.toFixed(2)}</strong> has been confirmed!</p>
     <p>The seller will ship your card soon. You'll receive tracking info when available.</p>`,
    "https://poke-trade.com/dashboard/purchases",
    "View Order"
  ).catch(() => {});

  sendUserNotification(
    sellerEmail,
    `You made a sale! ${cardName} 💰`,
    `<p>Great news! <strong>${buyerName}</strong> purchased your <strong>${cardName}</strong> for <strong>$${price.toFixed(2)}</strong>.</p>
     <p>Please ship the card promptly and add tracking information.</p>`,
    "https://poke-trade.com/dashboard/sales",
    "View Sale"
  ).catch(() => {});
}

export function notifyNewSubscription(username: string, email: string, tier: string): void {
  sendAdminNotification(
    `⭐ New ${tier} Member`,
    `<p><strong>${username}</strong> subscribed to <strong>${tier}</strong>!</p>`
  ).catch(() => {});

  const benefits = tier.toLowerCase() === "pro"
    ? `<ul style="padding-left:20px;">
         <li>Unlimited listings</li>
         <li>3% marketplace fee (save 40%)</li>
         <li>Priority trade matching</li>
         <li>Portfolio analytics & price alerts</li>
         <li>Pro badge on your profile</li>
       </ul>`
    : `<ul style="padding-left:20px;">
         <li>Everything in Pro</li>
         <li>Elite Protection Program (up to $250)</li>
         <li>Dedicated support channel</li>
         <li>Early access to new features</li>
         <li>Elite badge on your profile</li>
       </ul>`;

  sendUserNotification(
    email,
    `Welcome to ${tier}! ⭐`,
    `<p>Thanks for upgrading to <strong>${tier}</strong>!</p>
     <p>Here are your new benefits:</p>
     ${benefits}
     <p>Your benefits are active immediately. Happy trading!</p>`,
    "https://poke-trade.com/dashboard",
    "Go to Dashboard"
  ).catch(() => {});
}

export function notifyDisputeFiled(
  username: string,
  disputeId: string,
  relatedId: string,
  reason: string
): void {
  sendAdminNotification(
    "⚠️ New Dispute Filed",
    `<p><strong>${username}</strong> filed a dispute on trade/listing <strong>#${relatedId.slice(0, 8)}</strong></p>
     <p>Reason: ${reason}</p>`
  ).catch(() => {});
}

export function notifyInsuranceLead(name: string, email: string, collectionValue: number): void {
  sendAdminNotification(
    "🛡️ Insurance Referral Lead",
    `<p><strong>${name}</strong> (${email})</p>
     <p>Collection value: <strong>$${collectionValue.toLocaleString()}</strong></p>`
  ).catch(() => {});
}
