"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Repeat, ChevronLeft, ChevronRight, AlertTriangle,
  Eye, XCircle, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Trade {
  id: string;
  status: string;
  cash_amount: number | null;
  notes: string | null;
  shipping_tracking_sender: string | null;
  shipping_tracking_receiver: string | null;
  created_at: string;
  sender: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  receiver: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
}

interface TradeDetail {
  trade: Trade;
  items: any[];
  dispute: any | null;
}

const statusColors: Record<string, string> = {
  pending: "border-yellow-300 text-yellow-700 bg-yellow-50",
  accepted: "border-blue-300 text-blue-700 bg-blue-50",
  completed: "border-green-300 text-green-700 bg-green-50",
  declined: "border-red-300 text-red-700 bg-red-50",
  cancelled: "border-gray-300 text-gray-600 bg-gray-50",
  countered: "border-purple-300 text-purple-700 bg-purple-50",
};

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TradeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState("");
  const pageSize = 20;

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/trades?${params}`);
    const data = await res.json();
    setTrades(data.trades || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const viewDetail = async (id: string) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/trades/${id}`);
    const data = await res.json();
    setDetail(data);
    setDetailLoading(false);
  };

  const handleTradeAction = async (id: string, action: string) => {
    await fetch(`/api/admin/trades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: disputeNotes }),
    });
    setDetail(null);
    setDisputeNotes("");
    fetchTrades();
  };

  const totalPages = Math.ceil(total / pageSize);
  const statuses = ["", "pending", "accepted", "completed", "declined", "cancelled"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trade Management</h1>
        <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total trades</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
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

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Trade Detail</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>✕</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Sender</div>
                  <div className="font-medium text-sm">{detail.trade.sender?.display_name || detail.trade.sender?.username || "Unknown"}</div>
                  <div className="text-xs text-gray-400">@{detail.trade.sender?.username}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Receiver</div>
                  <div className="font-medium text-sm">{detail.trade.receiver?.display_name || detail.trade.receiver?.username || "Unknown"}</div>
                  <div className="text-xs text-gray-400">@{detail.trade.receiver?.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge variant="outline" className={`text-[10px] ${statusColors[detail.trade.status] || ""}`}>
                  {detail.trade.status}
                </Badge>
                {detail.trade.cash_amount && (
                  <Badge variant="outline" className="text-[10px]">
                    +${detail.trade.cash_amount}
                  </Badge>
                )}
              </div>

              {detail.items.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Cards Involved</div>
                  <div className="grid grid-cols-2 gap-2">
                    {detail.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {item.card?.image_url && (
                          <img src={item.card.image_url} alt="" className="h-10 w-7 rounded object-cover" />
                        )}
                        <div>
                          <div className="text-xs font-medium">{item.card?.name || "Unknown Card"}</div>
                          {item.card?.market_value && (
                            <div className="text-[10px] text-gray-500">${item.card.market_value}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.dispute && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Dispute: {detail.dispute.status}</span>
                  </div>
                  <p className="text-xs text-red-600 mb-2">{detail.dispute.reason}</p>
                  {detail.dispute.details && <p className="text-xs text-gray-600">{detail.dispute.details}</p>}
                </div>
              )}

              {/* Admin Actions */}
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm font-medium text-gray-700">Admin Actions</div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none"
                  rows={2}
                  placeholder="Admin notes..."
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  {detail.dispute && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleTradeAction(detail.trade.id, "resolve_dispute")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Resolve Dispute
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300"
                    onClick={() => handleTradeAction(detail.trade.id, "cancel")}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Cancel Trade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trades Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-600">Sender</th>
                  <th className="p-3 text-left font-medium text-gray-600">Receiver</th>
                  <th className="p-3 text-left font-medium text-gray-600">Status</th>
                  <th className="p-3 text-left font-medium text-gray-600">Cash</th>
                  <th className="p-3 text-left font-medium text-gray-600">Tracking</th>
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
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Repeat className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No trades found
                    </td>
                  </tr>
                ) : (
                  trades.map((trade, i) => (
                    <tr key={trade.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                      <td className="p-3">
                        <div className="font-medium text-gray-900 text-xs">
                          {trade.sender?.display_name || trade.sender?.username || "—"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900 text-xs">
                          {trade.receiver?.display_name || trade.receiver?.username || "—"}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] ${statusColors[trade.status] || ""}`}>
                          {trade.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-600 text-xs">
                        {trade.cash_amount ? `$${trade.cash_amount}` : "—"}
                      </td>
                      <td className="p-3">
                        {trade.shipping_tracking_sender ? (
                          <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">Has Tracking</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => viewDetail(trade.id)}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </p>
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
