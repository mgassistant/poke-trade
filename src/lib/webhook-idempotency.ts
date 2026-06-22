/**
 * Webhook idempotency — prevent replay attacks by tracking processed event IDs.
 * In-memory store with automatic expiry (events older than 24h are pruned).
 */

const processedEvents = new Map<string, number>(); // eventId -> timestamp
const EVENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Prune old entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - EVENT_TTL_MS;
    for (const [id, ts] of processedEvents) {
      if (ts < cutoff) processedEvents.delete(id);
    }
  }, 10 * 60_000);
}

/**
 * Check if an event has already been processed.
 * Returns true if this is a NEW event (not a replay).
 * Returns false if already processed (duplicate/replay).
 */
export function markEventProcessed(eventId: string): boolean {
  if (processedEvents.has(eventId)) {
    return false; // duplicate
  }
  processedEvents.set(eventId, Date.now());
  return true; // new event
}
