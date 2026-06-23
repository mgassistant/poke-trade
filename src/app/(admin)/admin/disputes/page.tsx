"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Gavel, AlertTriangle, Search, CheckCircle, Clock, Shield,
  Loader2, ChevronDown, ChevronUp, User, MessageSquare, Send
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import DisputeTimeline from "@/components/DisputeTimeline";

interface AdminDispute {
  id: string;
  trade_offer_id: string;
  initiator_id: string;
  respondent_id: string | null;
  reason: string;
  reason_category: string | null;
  details: string | null;
  evidence_photos: string[];
  evidence_description: string | null;
  respondent_response: string | null;
  respondent_evidence: string[];
  status: string;
  outcome: string | null;
  admin_decision: string | null;
  admin_reasoning: string | null;
  credit_amount: number;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

const OUTCOMES = [
  { value: "no_action", label: "No Action Needed" },
  { value: "warning", label: "Warning Issued" },
  { value: "restriction", label: "Account Restriction" },
  { value: "suspension", label: "Account Suspension" },
  { value: "ban", label: "Account Ban" },
  { value: "credit", label: "Platform Credit Issued" },
  { value: "refund", label: "Fee Refund" },
  { value: "other", label: "Other Discretionary Remedy" },
];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700 border-red-200",
  investigating: "bg-yellow-100 text-yellow-700 border-yellow-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "investigating" | "resolved">("all");

  // Decision form state (per dispute)
  const [decisionState, setDecisionState] = useState<Record<string, {
    outcome: string;
    reasoning: string;
    creditAmount: string;
    otherRemedy: string;
    submitting: boolean;
  }>>({});

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch("/api/disputes?admin=true");
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

  const getDecisionState = (id: string) =>
    decisionState[id] || { outcome: "", reasoning: "", creditAmount: "0", otherRemedy: "", submitting: false };

  const updateDecisionField = (id: string, field: string, value: string | boolean) => {
    setDecisionState((prev) => ({
      ...prev,
      [id]: { ...getDecisionState(id), [field]: value },
    }));
  };

  const handleDecision = async (disputeId: string) => {
    const state = getDecisionState(disputeId);
    if (!state.outcome || !state.reasoning) return;

    updateDecisionField(disputeId, "submitting", true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          outcome: state.outcome,
          reasoning: state.reasoning,
          credit_amount: state.outcome === "credit" ? parseFloat(state.creditAmount) || 0 : 0,
          admin_decision:
            state.outcome === "other" ? state.otherRemedy : OUTCOMES.find((o) => o.value === state.outcome)?.label,
        }),
      });
      if (res.ok) {
        fetchDisputes();
        setExpandedId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit decision");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      updateDecisionField(disputeId, "submitting", false);
    }
  };

  // Sort: open first, then investigating, then resolved — newest first within group
  const sortedDisputes = [...disputes].sort((a, b) => {
    const order: Record<string, number> = { open: 0, investigating: 1, resolved: 2, closed: 3 };
    const diff = (order[a.status] ?? 4) - (order[b.status] ?? 4);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredDisputes =
    filter === "all"
      ? sortedDisputes
      : sortedDisputes.filter((d) => d.status === filter);

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === "open").length,
    investigating: disputes.filter((d) => d.status === "investigating").length,
    resolved: disputes.filter((d) => d.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gavel className="h-6 w-6 text-red-500" />
          Dispute Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, investigate, and resolve platform disputes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          { label: "Open", value: stats.open, color: "text-red-600" },
          { label: "Investigating", value: stats.investigating, color: "text-yellow-600" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "investigating", "resolved"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gavel className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No disputes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => {
            const isExpanded = expandedId === dispute.id;
            const ds = getDecisionState(dispute.id);

            return (
              <Card key={dispute.id}>
                <CardContent className="p-0">
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {dispute.reason_category || dispute.reason}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[dispute.status] ?? ""}`}>
                          {dispute.status}
                        </Badge>
                        {dispute.credit_amount > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            ${dispute.credit_amount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Filed {new Date(dispute.created_at).toLocaleDateString()} · ID: {dispute.id.slice(0, 8)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded Panel */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-5">
                      {/* Evidence viewer */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Initiator side */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-medium">Initiator</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">ID: {dispute.initiator_id?.slice(0, 8)}</p>
                          {dispute.details && (
                            <p className="text-sm bg-white p-2 rounded border mt-2">
                              {dispute.details}
                            </p>
                          )}
                          {dispute.evidence_photos?.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {dispute.evidence_photos.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Evidence ${idx + 1}`}
                                  className="h-16 w-16 rounded object-cover border"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Respondent side */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-orange-500" />
                            <p className="text-sm font-medium">Respondent</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            ID: {dispute.respondent_id?.slice(0, 8) ?? "N/A"}
                          </p>
                          {dispute.respondent_response ? (
                            <p className="text-sm bg-white p-2 rounded border mt-2">
                              {dispute.respondent_response}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic mt-2">
                              No response yet
                            </p>
                          )}
                          {dispute.respondent_evidence?.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {dispute.respondent_evidence.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Resp Evidence ${idx + 1}`}
                                  className="h-16 w-16 rounded object-cover border"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Dispute Timeline
                        </p>
                        <DisputeTimeline dispute={dispute} />
                      </div>

                      <Separator />

                      {/* Decision Panel */}
                      {(dispute.status === "open" || dispute.status === "investigating") && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-red-500" />
                            <h3 className="font-semibold text-sm">Admin Decision</h3>
                          </div>

                          {/* Outcome */}
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Outcome *
                            </label>
                            <select
                              value={ds.outcome}
                              onChange={(e) => updateDecisionField(dispute.id, "outcome", e.target.value)}
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                            >
                              <option value="">Select outcome...</option>
                              {OUTCOMES.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Credit Amount (if credit) */}
                          {ds.outcome === "credit" && (
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">
                                Credit Amount ($)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={ds.creditAmount}
                                onChange={(e) => updateDecisionField(dispute.id, "creditAmount", e.target.value)}
                                className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Discretionary platform credit — not a guarantee or reimbursement.
                              </p>
                            </div>
                          )}

                          {/* Other Remedy */}
                          {ds.outcome === "other" && (
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">
                                Describe Remedy
                              </label>
                              <input
                                type="text"
                                value={ds.otherRemedy}
                                onChange={(e) => updateDecisionField(dispute.id, "otherRemedy", e.target.value)}
                                className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                                placeholder="Describe the discretionary remedy..."
                              />
                            </div>
                          )}

                          {/* Reasoning */}
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Reasoning * (visible to both parties)
                            </label>
                            <textarea
                              value={ds.reasoning}
                              onChange={(e) => updateDecisionField(dispute.id, "reasoning", e.target.value)}
                              rows={3}
                              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm resize-none"
                              placeholder="Explain the decision..."
                            />
                          </div>

                          <Button
                            onClick={() => handleDecision(dispute.id)}
                            disabled={!ds.outcome || !ds.reasoning || ds.submitting}
                            className="gap-2"
                          >
                            {ds.submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Submit Decision
                          </Button>
                        </div>
                      )}

                      {/* Past Decision */}
                      {dispute.status === "resolved" && dispute.outcome && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            Decision: {dispute.admin_decision ?? dispute.outcome}
                          </p>
                          {dispute.admin_reasoning && (
                            <p className="text-sm text-green-800">{dispute.admin_reasoning}</p>
                          )}
                          {dispute.credit_amount > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              ${dispute.credit_amount} discretionary platform credit issued
                            </p>
                          )}
                        </div>
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
