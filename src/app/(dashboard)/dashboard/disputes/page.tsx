"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Gavel, AlertTriangle, Clock, CheckCircle, Search as SearchIcon,
  Loader2, ChevronDown, ChevronUp, Plus, FileText, MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DisputeForm from "@/components/DisputeForm";
import DisputeTimeline from "@/components/DisputeTimeline";

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
  respondent_id: string | null;
  reason: string;
  reason_category: string | null;
  details: string | null;
  evidence_description: string | null;
  evidence_photos: string[];
  respondent_response: string | null;
  respondent_evidence: string[];
  status: string;
  resolution: string | null;
  outcome: string | null;
  admin_decision: string | null;
  admin_reasoning: string | null;
  credit_amount: number;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  trade_offer: DisputeTrade;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  open: { label: "Open", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  investigating: { label: "Under Review", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: SearchIcon },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  closed: { label: "Closed", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: Gavel },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");
  const [showForm, setShowForm] = useState(false);
  const [formTradeId, setFormTradeId] = useState("");

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      if (data.disputes) setDisputes(data.disputes);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openDisputes = disputes.filter(
    (d) => d.status === "open" || d.status === "investigating"
  );
  const resolvedDisputes = disputes.filter(
    (d) => d.status === "resolved" || d.status === "closed"
  );
  const displayedDisputes = activeTab === "open" ? openDisputes : resolvedDisputes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            Dispute Resolution Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            File and track disputes for trades and purchases
          </p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> File New Dispute
          </Button>
        )}
      </div>

      {/* New Dispute Form */}
      {showForm && (
        <div>
          <div className="mb-3">
            <label className="text-sm text-muted-foreground block mb-1">
              Trade ID (optional — enter if disputing a specific trade)
            </label>
            <input
              type="text"
              value={formTradeId}
              onChange={(e) => setFormTradeId(e.target.value)}
              placeholder="Enter trade ID"
              className="w-full max-w-md h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
            />
          </div>
          <DisputeForm
            tradeId={formTradeId || undefined}
            onSuccess={() => {
              setShowForm(false);
              setFormTradeId("");
              fetchDisputes();
            }}
            onCancel={() => {
              setShowForm(false);
              setFormTradeId("");
            }}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("open")}
          className="gap-2"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          My Open Disputes
          {openDisputes.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-1">
              {openDisputes.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("resolved")}
          className="gap-2"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Resolved Disputes
          {resolvedDisputes.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-1">
              {resolvedDisputes.length}
            </Badge>
          )}
        </Button>
      </div>

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
      ) : displayedDisputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gavel className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">
              No {activeTab === "open" ? "open" : "resolved"} disputes
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {activeTab === "open"
                ? "You don't have any open disputes."
                : "No resolved disputes yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedDisputes.map((dispute) => {
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {dispute.reason_category || dispute.reason}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                        {dispute.credit_amount > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            ${dispute.credit_amount} credit
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        vs {otherParty?.display_name || otherParty?.username || "Unknown"} · {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Details */}
                      {dispute.details && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Description</p>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">
                            {dispute.details}
                          </p>
                        </div>
                      )}

                      {/* Evidence Photos */}
                      {dispute.evidence_photos && dispute.evidence_photos.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Evidence Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {dispute.evidence_photos.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Evidence ${idx + 1}`}
                                className="h-16 w-16 rounded-lg object-cover border"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Timeline
                        </p>
                        <DisputeTimeline dispute={dispute} />
                      </div>

                      {/* Outcome */}
                      {dispute.outcome && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-700 font-medium mb-1">Decision</p>
                          <p className="text-sm text-green-800">{dispute.outcome}</p>
                          {dispute.admin_reasoning && (
                            <p className="text-xs text-green-600 mt-1">
                              {dispute.admin_reasoning}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Trade link */}
                      {dispute.trade_offer_id && (
                        <p className="text-xs text-muted-foreground">
                          Trade ID:{" "}
                          <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                            {dispute.trade_offer_id}
                          </code>
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
