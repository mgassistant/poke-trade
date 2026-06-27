"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Package, ChevronLeft, ChevronRight,
  Truck, ShieldCheck, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface VerificationTrade {
  id: string;
  status: string;
  shipping_tracking_sender: string | null;
  shipping_tracking_receiver: string | null;
  shipped_at_sender: string | null;
  shipped_at_receiver: string | null;
  received_at_sender: string | null;
  received_at_receiver: string | null;
  created_at: string;
  sender: { id: string; username: string; display_name: string | null } | null;
  receiver: { id: string; username: string; display_name: string | null } | null;
}

export default function VerificationPage() {
  const [trades, setTrades] = useState<VerificationTrade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const pageSize = 20;

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/verification?${params}`);
    const data = await res.json();
    setTrades(data.trades || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const handleAction = async (tradeId: string, action: string) => {
    await fetch("/api/admin/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId, action, notes: actionNotes[tradeId] || "" }),
    });
    fetchTrades();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trade Protection Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Protected trades queue — {total} trades with tracking
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "accepted", "completed", "cancelled"].map((s) => (
          <Button
            key={s || "all"}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className="text-xs"
          >
            {s || "All Protected"}
          </Button>
        ))}
      </div>

      {/* Verification Cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : trades.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No verified trades in queue</h3>
              <p className="text-sm text-gray-500">Trades with shipping tracking will appear here</p>
            </CardContent>
          </Card>
        ) : (
          trades.map((trade) => (
            <Card key={trade.id} className="border border-gray-200">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm text-gray-900">
                        Trade #{trade.id.slice(0, 8)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          trade.status === "completed"
                            ? "border-green-300 text-green-700 bg-green-50"
                            : trade.status === "accepted"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "border-gray-300 text-gray-600"
                        }`}
                      >
                        {trade.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {new Date(trade.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sender</div>
                    <div className="font-medium text-sm">{trade.sender?.display_name || trade.sender?.username}</div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Truck className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">
                          {trade.shipping_tracking_sender || "No tracking"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {trade.shipped_at_sender ? (
                          <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-700">Shipped</span></>
                        ) : (
                          <><Clock className="h-3 w-3 text-yellow-500" /><span className="text-yellow-700">Pending ship</span></>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {trade.received_at_receiver ? (
                          <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-700">Received by receiver</span></>
                        ) : (
                          <><Clock className="h-3 w-3 text-gray-400" /><span className="text-gray-500">Not received yet</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Receiver</div>
                    <div className="font-medium text-sm">{trade.receiver?.display_name || trade.receiver?.username}</div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Truck className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">
                          {trade.shipping_tracking_receiver || "No tracking"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {trade.shipped_at_receiver ? (
                          <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-700">Shipped</span></>
                        ) : (
                          <><Clock className="h-3 w-3 text-yellow-500" /><span className="text-yellow-700">Pending ship</span></>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {trade.received_at_sender ? (
                          <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-700">Received by sender</span></>
                        ) : (
                          <><Clock className="h-3 w-3 text-gray-400" /><span className="text-gray-500">Not received yet</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
                      placeholder="Admin notes..."
                      value={actionNotes[trade.id] || ""}
                      onChange={(e) => setActionNotes({ ...actionNotes, [trade.id]: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!trade.received_at_sender && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAction(trade.id, "mark_received_sender")}>
                        <Package className="h-3 w-3 mr-1" /> Mark Sender Received
                      </Button>
                    )}
                    {!trade.received_at_receiver && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAction(trade.id, "mark_received_receiver")}>
                        <Package className="h-3 w-3 mr-1" /> Mark Receiver Received
                      </Button>
                    )}
                    {trade.status !== "completed" && (
                      <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(trade.id, "approve")}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}
                    {trade.status !== "cancelled" && (
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-300" onClick={() => handleAction(trade.id, "reject")}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
