/**
 * Immutable Trade Documentation System
 *
 * Generates permanent, tamper-proof digital records for every trade.
 * Each record includes a SHA-256 integrity hash.
 */

export interface TradeEvent {
  id: string;
  trade_id: string;
  event_type: TradeEventType;
  actor_id: string;
  details: Record<string, unknown>;
  photos: string[];
  integrity_hash: string | null;
  created_at: string;
}

export type TradeEventType =
  | "created"
  | "countered"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "locked"
  | "shipped"
  | "delivered"
  | "reviewed"
  | "disputed"
  | "resolved"
  | "completed";

export interface TradeParticipant {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number;
  verification_level: number;
}

export interface TradeCardItem {
  card_id: string;
  card_name: string;
  card_number: string;
  card_set: string;
  market_value: number | null;
  condition: string | null;
  image_url: string | null;
  owner_id: string;
}

export interface ShippingRecord {
  sender_tracking: string | null;
  sender_carrier: string | null;
  sender_shipped_at: string | null;
  sender_received_at: string | null;
  sender_confirmed: boolean;
  receiver_tracking: string | null;
  receiver_carrier: string | null;
  receiver_shipped_at: string | null;
  receiver_received_at: string | null;
  receiver_confirmed: boolean;
  sender_photos: string[];
  receiver_photos: string[];
}

export interface TradeRecord {
  trade_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  sender: TradeParticipant;
  receiver: TradeParticipant;
  items: TradeCardItem[];
  cash_amount: number | null;
  trade_value: number | null;
  shipping_method: string | null;
  shipping: ShippingRecord | null;
  events: TradeEvent[];
  versions: TradeVersion[];
  reviews: TradeReviewSummary[];
  integrity_hash: string;
  generated_at: string;
}

export interface TradeVersion {
  version_number: number;
  proposed_by: string;
  action: string;
  cash_amount: number | null;
  notes: string | null;
  items_offered: unknown[];
  items_wanted: unknown[];
  created_at: string;
}

export interface TradeReviewSummary {
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  communication_rating: number | null;
  accuracy_rating: number | null;
  shipping_rating: number | null;
  condition_rating: number | null;
  comment: string | null;
  created_at: string;
}

/**
 * Generate a SHA-256 hash of the trade record for integrity verification.
 * Uses Web Crypto API (available in Node.js 18+ and browsers).
 */
export async function hashTradeRecord(record: Omit<TradeRecord, "integrity_hash">): Promise<string> {
  const payload = JSON.stringify({
    trade_id: record.trade_id,
    status: record.status,
    created_at: record.created_at,
    completed_at: record.completed_at,
    sender_id: record.sender.id,
    receiver_id: record.receiver.id,
    items: record.items.map((i) => ({
      card_id: i.card_id,
      owner_id: i.owner_id,
      market_value: i.market_value,
    })),
    cash_amount: record.cash_amount,
    trade_value: record.trade_value,
    events: record.events.map((e) => ({
      event_type: e.event_type,
      actor_id: e.actor_id,
      created_at: e.created_at,
    })),
    versions: record.versions.map((v) => ({
      version_number: v.version_number,
      proposed_by: v.proposed_by,
      action: v.action,
    })),
    generated_at: record.generated_at,
  });

  // Use Node.js crypto in server context, fallback to Web Crypto
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback for Node.js without Web Crypto
  const { createHash } = await import("crypto");
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Get the human-readable label for an event type.
 */
export function getEventTypeLabel(eventType: TradeEventType): string {
  const labels: Record<TradeEventType, string> = {
    created: "Trade Created",
    countered: "Counter Offer",
    accepted: "Trade Accepted",
    rejected: "Trade Declined",
    cancelled: "Trade Cancelled",
    locked: "Trade Locked",
    shipped: "Cards Shipped",
    delivered: "Cards Delivered",
    reviewed: "Review Submitted",
    disputed: "Dispute Opened",
    resolved: "Dispute Resolved",
    completed: "Trade Completed",
  };
  return labels[eventType] || eventType;
}

/**
 * Get the icon/emoji for an event type.
 */
export function getEventTypeIcon(eventType: TradeEventType): string {
  const icons: Record<TradeEventType, string> = {
    created: "📝",
    countered: "🔄",
    accepted: "✅",
    rejected: "❌",
    cancelled: "🚫",
    locked: "🔒",
    shipped: "📦",
    delivered: "📬",
    reviewed: "⭐",
    disputed: "⚠️",
    resolved: "✔️",
    completed: "🎉",
  };
  return icons[eventType] || "📋";
}

/**
 * Generate a downloadable text summary of the trade record.
 */
export function generateTradeRecordSummary(record: TradeRecord): string {
  const lines: string[] = [
    "═══════════════════════════════════════════════",
    "       POKÉ-TRADE — OFFICIAL TRADE RECORD",
    "═══════════════════════════════════════════════",
    "",
    `Trade ID:      ${record.trade_id}`,
    `Status:        ${record.status.toUpperCase()}`,
    `Created:       ${new Date(record.created_at).toLocaleString()}`,
    record.completed_at ? `Completed:     ${new Date(record.completed_at).toLocaleString()}` : "",
    "",
    "── PARTICIPANTS ──────────────────────────────",
    `Sender:        ${record.sender.display_name || record.sender.username} (Trust: ${record.sender.trust_score})`,
    `Receiver:      ${record.receiver.display_name || record.receiver.username} (Trust: ${record.receiver.trust_score})`,
    "",
    "── ITEMS ─────────────────────────────────────",
  ];

  const senderItems = record.items.filter((i) => i.owner_id === record.sender.id);
  const receiverItems = record.items.filter((i) => i.owner_id === record.receiver.id);

  lines.push(`Sender offers (${senderItems.length}):`);
  senderItems.forEach((item) => {
    lines.push(`  • ${item.card_name} (#${item.card_number}) — ${item.card_set} — $${item.market_value?.toFixed(2) || "N/A"}`);
  });

  lines.push(`Receiver offers (${receiverItems.length}):`);
  receiverItems.forEach((item) => {
    lines.push(`  • ${item.card_name} (#${item.card_number}) — ${item.card_set} — $${item.market_value?.toFixed(2) || "N/A"}`);
  });

  if (record.cash_amount) {
    lines.push(`Cash included:  $${record.cash_amount.toFixed(2)}`);
  }
  if (record.trade_value) {
    lines.push(`Total value:    $${record.trade_value.toFixed(2)}`);
  }

  lines.push("", "── TIMELINE ──────────────────────────────────");
  record.events.forEach((event) => {
    lines.push(`${getEventTypeIcon(event.event_type)} ${new Date(event.created_at).toLocaleString()} — ${getEventTypeLabel(event.event_type)}`);
    if (event.details && Object.keys(event.details).length > 0) {
      lines.push(`   Details: ${JSON.stringify(event.details)}`);
    }
  });

  if (record.shipping) {
    lines.push("", "── SHIPPING ──────────────────────────────────");
    if (record.shipping.sender_tracking) {
      lines.push(`Sender tracking:   ${record.shipping.sender_tracking} (${record.shipping.sender_carrier || "N/A"})`);
    }
    if (record.shipping.receiver_tracking) {
      lines.push(`Receiver tracking: ${record.shipping.receiver_tracking} (${record.shipping.receiver_carrier || "N/A"})`);
    }
  }

  if (record.reviews.length > 0) {
    lines.push("", "── REVIEWS ───────────────────────────────────");
    record.reviews.forEach((review) => {
      lines.push(`${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)} — ${review.comment || "No comment"}`);
    });
  }

  lines.push(
    "",
    "── INTEGRITY ─────────────────────────────────",
    `SHA-256: ${record.integrity_hash}`,
    `Generated: ${new Date(record.generated_at).toLocaleString()}`,
    "",
    "═══════════════════════════════════════════════",
    "This record is generated by Poké-Trade and is",
    "intended for reference only. Hash can be used",
    "to verify record integrity.",
    "═══════════════════════════════════════════════"
  );

  return lines.filter((l) => l !== undefined).join("\n");
}
