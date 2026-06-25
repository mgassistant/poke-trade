"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Ticket, Plus, ChevronRight, Loader2, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/support/TicketStatusBadge";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_user", label: "Waiting on Me" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  order_issue: "Order Issue",
  account: "Account",
  trade_dispute: "Trade Dispute",
  billing: "Billing",
  other: "Other",
};

export default function MySupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{
    ticket: SupportTicket & { message: string; name: string; email: string };
    replies: Array<{ id: string; message: string; is_admin: boolean; created_at: string }>;
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetch("/api/support")
      .then(r => r.json())
      .then(data => setTickets(data.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const loadTicketDetail = async (id: string) => {
    setSelectedTicket(id);
    try {
      const res = await fetch(`/api/support/${id}`);
      const data = await res.json();
      setTicketDetail(data);
    } catch {
      setTicketDetail(null);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      await fetch(`/api/support/${selectedTicket}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      setReplyText("");
      loadTicketDetail(selectedTicket);
    } catch {
      // Ignore
    } finally {
      setReplying(false);
    }
  };

  if (selectedTicket && ticketDetail) {
    return (
      <div>
        <button
          onClick={() => { setSelectedTicket(null); setTicketDetail(null); }}
          className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to tickets
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{ticketDetail.ticket.subject}</h1>
            <TicketStatusBadge status={ticketDetail.ticket.status} />
          </div>
          <p className="text-sm text-gray-500">
            {CATEGORY_LABELS[ticketDetail.ticket.category]} · Submitted {new Date(ticketDetail.ticket.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Original message */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                {ticketDetail.ticket.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-gray-900">{ticketDetail.ticket.name}</span>
              <span className="text-xs text-gray-400">{new Date(ticketDetail.ticket.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticketDetail.ticket.message}</p>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-3 mb-4">
          {ticketDetail.replies.map((reply) => (
            <Card key={reply.id} className={reply.is_admin ? "border-red-200 bg-red-50/30" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    reply.is_admin ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {reply.is_admin ? "S" : "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {reply.is_admin ? "Support Team" : "You"}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply form */}
        {!["resolved", "closed"].includes(ticketDetail.ticket.status) && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none mb-3"
              />
              <Button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                {replying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MessageSquare className="h-4 w-4 mr-1" />}
                Reply
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your support requests</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
          <Link href="/contact"><Plus className="h-4 w-4 mr-1" /> New Ticket</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No tickets found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {filter === "all" ? "You haven't submitted any support tickets yet." : "No tickets with this status."}
          </p>
          <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => loadTicketDetail(ticket.id)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{CATEGORY_LABELS[ticket.category]}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
