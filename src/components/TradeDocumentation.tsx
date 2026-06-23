"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Shield, Clock, Loader2, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type TradeRecord,
  type TradeEvent,
  getEventTypeLabel,
  getEventTypeIcon,
  generateTradeRecordSummary,
} from "@/lib/trade-documentation";

interface TradeDocumentationProps {
  tradeId: string;
}

export function TradeDocumentation({ tradeId }: TradeDocumentationProps) {
  const [record, setRecord] = useState<TradeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/${tradeId}/documentation`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load documentation");
      setRecord(data.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documentation");
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    fetchDocumentation();
  }, [fetchDocumentation]);

  const handleDownload = () => {
    if (!record) return;
    const summary = generateTradeRecordSummary(record);
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-record-${tradeId.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchDocumentation} className="mt-3">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!record) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold">Trade Documentation</h2>
          <Badge variant="outline" className="text-xs">Immutable Record</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Record
        </Button>
      </div>

      {/* Participants */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <h3 className="text-sm font-semibold mb-3">Participants</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Sender</div>
              <div className="font-medium text-sm">{record.sender.display_name || record.sender.username}</div>
              <div className="text-xs text-muted-foreground">Trust: {record.sender.trust_score}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Receiver</div>
              <div className="font-medium text-sm">{record.receiver.display_name || record.receiver.username}</div>
              <div className="text-xs text-muted-foreground">Trust: {record.receiver.trust_score}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {record.items.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <h3 className="text-sm font-semibold mb-3">Items Traded</h3>
            <div className="space-y-2">
              {record.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.card_name}</span>
                    <span className="text-muted-foreground ml-1">#{item.card_number}</span>
                    <span className="text-muted-foreground ml-1">— {item.card_set}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.market_value !== null && (
                      <span className="text-xs text-muted-foreground">${item.market_value.toFixed(2)}</span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {item.owner_id === record.sender.id ? "Sender" : "Receiver"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {record.cash_amount && (
              <div className="mt-2 pt-2 border-t text-sm">
                <span className="text-muted-foreground">Cash included:</span>{" "}
                <span className="font-semibold">${record.cash_amount.toFixed(2)}</span>
              </div>
            )}
            {record.trade_value && (
              <div className="text-sm">
                <span className="text-muted-foreground">Total value:</span>{" "}
                <span className="font-semibold">${record.trade_value.toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Event Timeline
          </h3>
          {record.events.length > 0 ? (
            <div className="relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {record.events.map((event, idx) => (
                  <TimelineEvent key={event.id || idx} event={event} isLast={idx === record.events.length - 1} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No events recorded yet. Events are logged as the trade progresses.</p>
          )}

          {/* Also show version history as timeline entries if no events */}
          {record.events.length === 0 && record.versions.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">Version History</h4>
              {record.versions.map((version, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                    v{version.version_number}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{version.action}</div>
                    {version.notes && <p className="text-xs text-muted-foreground">{version.notes}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping */}
      {record.shipping && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <h3 className="text-sm font-semibold mb-3">Shipping Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Sender Shipment</div>
                {record.shipping.sender_tracking ? (
                  <>
                    <div className="font-mono text-xs">{record.shipping.sender_tracking}</div>
                    <div className="text-xs text-muted-foreground">{record.shipping.sender_carrier}</div>
                    {record.shipping.sender_confirmed && (
                      <Badge className="mt-1 text-xs bg-green-100 text-green-700 border-green-200">Received ✓</Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Not shipped yet</span>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Receiver Shipment</div>
                {record.shipping.receiver_tracking ? (
                  <>
                    <div className="font-mono text-xs">{record.shipping.receiver_tracking}</div>
                    <div className="text-xs text-muted-foreground">{record.shipping.receiver_carrier}</div>
                    {record.shipping.receiver_confirmed && (
                      <Badge className="mt-1 text-xs bg-green-100 text-green-700 border-green-200">Received ✓</Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Not shipped yet</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {record.reviews.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <h3 className="text-sm font-semibold mb-3">Reviews</h3>
            <div className="space-y-3">
              {record.reviews.map((review, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    {"★".repeat(review.rating).split("").map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                    {"☆".repeat(5 - review.rating).split("").map((_, i) => (
                      <span key={i} className="text-muted-foreground/30">☆</span>
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-xs text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrity Hash */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold">Integrity Verification</h3>
          </div>
          <div className="font-mono text-xs text-muted-foreground break-all bg-muted/50 rounded p-2">
            SHA-256: {record.integrity_hash}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Generated: {new Date(record.generated_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineEvent({ event, isLast }: { event: TradeEvent; isLast: boolean }) {
  const icon = getEventTypeIcon(event.event_type);
  const label = getEventTypeLabel(event.event_type);

  return (
    <div className="flex items-start gap-3 relative">
      <div className="h-7 w-7 rounded-full bg-white border-2 border-border flex items-center justify-center text-sm z-10 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="font-medium text-sm">{label}</div>
        {event.details && Object.keys(event.details).length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {typeof event.details === "object" && "message" in event.details
              ? String(event.details.message)
              : JSON.stringify(event.details)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {new Date(event.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
