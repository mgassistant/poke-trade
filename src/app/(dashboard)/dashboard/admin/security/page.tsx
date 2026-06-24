"use client";

import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, Clock, Activity,
  Eye, Lock, RefreshCw, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface RateLimitViolation {
  id: string;
  ip_address: string;
  endpoint: string | null;
  violation_count: number;
  created_at: string;
}

export default function SecurityDashboardPage() {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [auditRes] = await Promise.all([
        fetch("/api/admin/audit-log?limit=20"),
      ]);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const suspiciousActions = auditLogs.filter(
    (log) =>
      log.action.includes("failed") ||
      log.action.includes("blocked") ||
      log.action.includes("violation")
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor platform security and audit activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Audit Events (Recent)</p>
              <p className="text-lg font-bold">{auditLogs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suspicious Activity</p>
              <p className="text-lg font-bold">{suspiciousActions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Lock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rate Limit Violations</p>
              <p className="text-lg font-bold">{violations.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Recent Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No audit events recorded yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 bg-muted/20 rounded-lg text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] ${
                          log.action.includes("failed") || log.action.includes("blocked")
                            ? "bg-red-100 text-red-700 border-red-200"
                            : log.action.includes("admin")
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {log.action}
                      </Badge>
                      {log.ip_address && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {log.ip_address}
                        </span>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {JSON.stringify(log.details).slice(0, 120)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limit Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Rate Limit Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No rate limit violations recorded.
            </p>
          ) : (
            <div className="space-y-2">
              {violations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-mono text-xs">{v.ip_address}</p>
                    <p className="text-[10px] text-muted-foreground">{v.endpoint}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                      {v.violation_count} violations
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
