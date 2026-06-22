"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileWarning, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Eye, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Report {
  id: string;
  report_type: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { username: string; display_name: string | null; avatar_url: string | null } | null;
  reported_user: { username: string; display_name: string | null } | null;
  listing: { id: string; title: string; price: number } | null;
}

interface Summary {
  pending: number;
  resolved: number;
  dismissed: number;
}

const statusColors: Record<string, string> = {
  pending: "border-yellow-300 text-yellow-700 bg-yellow-50",
  reviewed: "border-blue-300 text-blue-700 bg-blue-50",
  resolved: "border-green-300 text-green-700 bg-green-50",
  dismissed: "border-gray-300 text-gray-600 bg-gray-50",
};

const typeColors: Record<string, string> = {
  scam: "border-red-300 text-red-700 bg-red-50",
  counterfeit: "border-orange-300 text-orange-700 bg-orange-50",
  bug: "border-blue-300 text-blue-700 bg-blue-50",
  other: "border-gray-300 text-gray-600 bg-gray-50",
  admin_flag: "border-purple-300 text-purple-700 bg-purple-50",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({ pending: 0, resolved: 0, dismissed: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [notesModal, setNotesModal] = useState<{ id: string; action: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const pageSize = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/admin/reports?${params}`);
    const data = await res.json();
    setReports(data.reports || []);
    setTotal(data.total || 0);
    if (data.summary) setSummary(data.summary);
    setLoading(false);
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async (reportId: string, action: string, notes?: string) => {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action, notes }),
    });
    setNotesModal(null);
    setAdminNotes("");
    fetchReports();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total reports</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-yellow-200">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
            <div className="text-xs text-gray-500">Resolved</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{summary.dismissed}</div>
            <div className="text-xs text-gray-500">Dismissed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {["", "pending", "reviewed", "resolved", "dismissed"].map((s) => (
            <Button
              key={s || "all"}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="text-xs"
            >
              {s || "All"}
            </Button>
          ))}
        </div>
        <div className="w-px bg-gray-300" />
        <div className="flex gap-1">
          {["", "scam", "counterfeit", "bug", "other"].map((t) => (
            <Button
              key={t || "all-types"}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className="text-xs"
            >
              {t || "All Types"}
            </Button>
          ))}
        </div>
      </div>

      {/* Notes Modal */}
      {notesModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setNotesModal(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base capitalize">{notesModal.action} Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none"
                rows={3}
                placeholder="Add notes (optional)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setNotesModal(null)}>Cancel</Button>
                <Button
                  size="sm"
                  className={notesModal.action === "dismiss" ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"}
                  onClick={() => handleAction(notesModal.id, notesModal.action, adminNotes)}
                >
                  {notesModal.action === "resolve" ? "Resolve" : notesModal.action === "dismiss" ? "Dismiss" : "Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-600">Type</th>
                  <th className="p-3 text-left font-medium text-gray-600">Reporter</th>
                  <th className="p-3 text-left font-medium text-gray-600">Target</th>
                  <th className="p-3 text-left font-medium text-gray-600">Reason</th>
                  <th className="p-3 text-left font-medium text-gray-600">Status</th>
                  <th className="p-3 text-left font-medium text-gray-600">Date</th>
                  <th className="p-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="p-3"><Skeleton className="h-5 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <FileWarning className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report, i) => (
                    <tr key={report.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] ${typeColors[report.report_type] || typeColors.other}`}>
                          {report.report_type}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {report.reporter?.display_name || report.reporter?.username || "—"}
                      </td>
                      <td className="p-3 text-xs">
                        {report.reported_user ? (
                          <span className="text-gray-900">@{report.reported_user.username}</span>
                        ) : report.listing ? (
                          <span className="text-gray-900">{report.listing.title}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-gray-900 max-w-[200px] truncate">{report.reason}</div>
                        {report.details && (
                          <div className="text-[10px] text-gray-500 mt-0.5 max-w-[200px] truncate">{report.details}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] ${statusColors[report.status] || ""}`}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {report.status === "pending" || report.status === "reviewed" ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-green-600"
                              onClick={() => setNotesModal({ id: report.id, action: "resolve" })}
                              title="Resolve"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-gray-600"
                              onClick={() => setNotesModal({ id: report.id, action: "dismiss" })}
                              title="Dismiss"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                            {report.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-blue-600"
                                onClick={() => handleAction(report.id, "review")}
                                title="Mark Reviewed"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
