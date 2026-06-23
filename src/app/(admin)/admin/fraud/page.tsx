"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  Ban, Eye, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import type { RiskLevel } from "@/lib/fraud-detection";

interface FraudFlag {
  id: string;
  listing_id: string | null;
  trade_id: string | null;
  user_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  flags: string[];
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile?: {
    username: string;
    display_name: string | null;
    trust_score: number;
    verification_level: number;
  };
  listing?: {
    title: string;
    price: number;
  };
}

export default function FraudDashboardPage() {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fraud");
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleAction = async (flagId: string, action: string) => {
    setActionLoading(flagId);
    try {
      await fetch("/api/admin/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_id: flagId, action }),
      });
      fetchFlags();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const pendingFlags = flags.filter((f) => f.status === "pending");
  const reviewedFlags = flags.filter((f) => f.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            Fraud Prevention
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review flagged listings and suspicious activity
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchFlags} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{pendingFlags.length}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Shield className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{flags.filter((f) => f.risk_level === "high").length}</div>
            <div className="text-xs text-muted-foreground">High Risk</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{reviewedFlags.length}</div>
            <div className="text-xs text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Flags */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pending Review</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : pendingFlags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-10 w-10 text-green-500/30 mb-3" />
              <p className="text-sm text-muted-foreground">No pending flags — all clear!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingFlags.map((flag) => (
              <Card key={flag.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {flag.profile?.display_name || flag.profile?.username || "Unknown User"}
                        </span>
                        <RiskBadge level={flag.risk_level} score={flag.risk_score} compact />
                        {flag.listing && (
                          <Badge variant="outline" className="text-xs">
                            ${flag.listing.price?.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      {flag.listing && (
                        <p className="text-sm text-muted-foreground mb-1">{flag.listing.title}</p>
                      )}
                      <div className="space-y-1">
                        {flag.flags.map((f, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>⚠️</span> {f}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Flagged: {new Date(flag.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(flag.id, "approve")}
                        disabled={actionLoading === flag.id}
                        className="gap-1 text-xs"
                      >
                        {actionLoading === flag.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(flag.id, "suspend")}
                        disabled={actionLoading === flag.id}
                        className="gap-1 text-xs"
                      >
                        <XCircle className="h-3 w-3 text-yellow-600" />
                        Suspend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(flag.id, "ban")}
                        disabled={actionLoading === flag.id}
                        className="gap-1 text-xs text-red-600"
                      >
                        <Ban className="h-3 w-3" />
                        Ban
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed */}
      {reviewedFlags.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Previously Reviewed</h2>
          <div className="space-y-2">
            {reviewedFlags.slice(0, 20).map((flag) => (
              <Card key={flag.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{flag.profile?.username || "Unknown"}</span>
                      <RiskBadge level={flag.risk_level} score={flag.risk_score} compact />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        flag.status === "approved"
                          ? "border-green-200 text-green-700"
                          : flag.status === "banned"
                          ? "border-red-200 text-red-700"
                          : "border-yellow-200 text-yellow-700"
                      }`}
                    >
                      {flag.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
