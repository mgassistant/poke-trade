"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Gavel, AlertTriangle, Clock, CheckCircle, Search as SearchIcon,
  Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DisputeProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface DisputeTrade {
  id: string;
  status: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender: DisputeProfile;
  receiver: DisputeProfile;
}

interface Dispute {
  id: string;
  trade_offer_id: string;
  initiator_id: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  trade_offer: DisputeTrade;
}

const DISPUTE_REASONS = [
  "Item not received",
  "Wrong item sent",
  "Damaged item",
  "Counterfeit card",
  "Other",
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  open: { label: "Open", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  investigating: { label: "Investigating", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: SearchIcon },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  closed: { label: "Closed", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: Gavel },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New dispute form
  const [showForm, setShowForm] = useState(false);
  const [tradeId, setTradeId] = useState("");
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      if (data.disputes) setDisputes(data.disputes);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleSubmit = async () => {
    if (!tradeId || !reason) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_offer_id: tradeId,
          reason,
          details: details || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setTradeId("");
        setDetails("");
        fetchDisputes();
      } else {
        alert(data.error || "Failed to open dispute");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
          <p className="text-muted-foreground text-sm mt-1">Open and resolved disputes</p>
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Open Dispute
          </Button>
        )}
      </div>

      {/* New Dispute Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Open a Dispute</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Trade ID</label>
                <input
                  type="text"
                  value={tradeId}
                  onChange={(e) => setTradeId(e.target.value)}
                  placeholder="Enter the trade ID"
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                >
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full h-24 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground resize-none"
                  maxLength={1000}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitting || !tradeId} variant="destructive" className="gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Submit Dispute
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gavel className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No disputes</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              You haven&apos;t opened any disputes. Hopefully you won&apos;t need to!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const statusCfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === dispute.id;
            const trade = dispute.trade_offer;
            const otherParty = trade
              ? (trade.sender_id === dispute.initiator_id ? trade.receiver : trade.sender)
              : null;

            return (
              <Card key={dispute.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{dispute.reason}</span>
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        vs {otherParty?.display_name || otherParty?.username || "Unknown"} · Opened {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-3">
                      {/* Timeline */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Opened:</span>
                          <span>{new Date(dispute.created_at).toLocaleString()}</span>
                        </div>
                        {dispute.updated_at !== dispute.created_at && (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Updated:</span>
                            <span>{new Date(dispute.updated_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      {dispute.details && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Details:</p>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">{dispute.details}</p>
                        </div>
                      )}

                      {/* Resolution */}
                      {dispute.resolution && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resolution:</p>
                          <p className="text-sm bg-green-500/10 border border-green-500/20 p-3 rounded-md">
                            {dispute.resolution}
                          </p>
                        </div>
                      )}

                      {/* Trade link */}
                      {dispute.trade_offer_id && (
                        <p className="text-xs text-muted-foreground">
                          Trade ID: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{dispute.trade_offer_id}</code>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
