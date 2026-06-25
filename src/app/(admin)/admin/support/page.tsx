"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Ticket, MessageSquare, Loader2, Clock, ChevronRight,
  AlertCircle, CheckCircle, BarChart3, Send
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketStatusBadge, TicketPriorityBadge } from "@/components/support/TicketStatusBadge";

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface Reply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  name: string | null;
  email: string | null;
  type: string;
  message: string;
  rating: number | null;
  is_public: boolean;
  status: string;
  admin_response: string | null;
  created_at: string;
}

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

const STATUSES = ["new", "open", "in_progress", "waiting_on_user", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

export default function AdminSupportPage() {
  const [tab, setTab] = useState<"tickets" | "feedback">("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Ticket detail
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{ ticket: SupportTicket; replies: Reply[] } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/support").then(r => r.json()),
      fetch("/api/feedback").then(r => r.json()),
    ]).then(([supportData, feedbackData]) => {
      setTickets(supportData.tickets || []);
      setFeedback(feedbackData.feedback || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadTicket = async (id: string) => {
    setSelectedTicket(id);
    const res = await fetch(`/api/support/${id}`);
    const data = await res.json();
    setTicketDetail(data);
    setAdminNotes(data.ticket?.admin_notes || "");
  };

  const updateTicket = async (updates: Record<string, string | null>) => {
    if (!selectedTicket) return;
    await fetch(`/api/support/${selectedTicket}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    loadTicket(selectedTicket);
    // Refresh list
    const res = await fetch("/api/support");
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    await fetch(`/api/support/${selectedTicket}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText }),
    });
    setReplyText("");
    loadTicket(selectedTicket);
    setReplying(false);
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  // Stats
  const openCount = tickets.filter(t => ["new", "open", "in_progress"].includes(t.status)).length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const today = new Date().toDateString();
  const resolvedToday = tickets.filter(t => t.resolved_at && new Date(t.resolved_at).toDateString() === today).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Ticket Detail View
  if (selectedTicket && ticketDetail) {
    const t = ticketDetail.ticket;
    return (
      <div>
        <button
          onClick={() => { setSelectedTicket(null); setTicketDetail(null); }}
          className="text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          ← Back to all tickets
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Thread */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{t.subject}</h1>
              <TicketStatusBadge status={t.status} />
              <TicketPriorityBadge priority={t.priority} />
            </div>
            <p className="text-sm text-gray-500">
              From: {t.name} ({t.email}) · {CATEGORY_LABELS[t.category]} · {new Date(t.created_at).toLocaleString()}
            </p>

            {/* Original message */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {t.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.message}</p>
              </CardContent>
            </Card>

            {/* Replies */}
            {ticketDetail.replies.map((reply) => (
              <Card key={reply.id} className={reply.is_admin ? "border-red-200 bg-red-50/30" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      reply.is_admin ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                    }`}>
                      {reply.is_admin ? "A" : "U"}
                    </div>
                    <span className="text-sm font-medium">{reply.is_admin ? "Admin" : t.name}</span>
                    <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                </CardContent>
              </Card>
            ))}

            {/* Reply as admin */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply as admin..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none mb-3"
                />
                <Button
                  onClick={sendReply}
                  disabled={replying || !replyText.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {replying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Send Reply
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
                <select
                  value={t.status}
                  onChange={(e) => updateTicket({ status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority</h3>
                <select
                  value={t.priority}
                  onChange={(e) => updateTicket({ priority: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Internal Notes</h3>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes (not visible to user)..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none resize-none mb-2"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTicket({ admin_notes: adminNotes })}
                  className="text-xs"
                >
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Support Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open Tickets", value: openCount, icon: <AlertCircle className="h-5 w-5" />, color: "text-blue-600 bg-blue-50" },
          { label: "In Progress", value: inProgressCount, icon: <Clock className="h-5 w-5" />, color: "text-purple-600 bg-purple-50" },
          { label: "Resolved Today", value: resolvedToday, icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
          { label: "Total Tickets", value: tickets.length, icon: <BarChart3 className="h-5 w-5" />, color: "text-gray-600 bg-gray-50" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {[
          { key: "tickets" as const, label: "Support Tickets", icon: <Ticket className="h-4 w-4" /> },
          { key: "feedback" as const, label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.icon} {t.label}
            <Badge className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 ml-1">
              {t.key === "tickets" ? tickets.length : feedback.length}
            </Badge>
          </button>
        ))}
      </div>

      {tab === "tickets" ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Ticket list */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tickets match your filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => loadTicket(ticket.id)}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                            <TicketStatusBadge status={ticket.status} />
                            <TicketPriorityBadge priority={ticket.priority} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{ticket.name} ({ticket.email})</span>
                            <span>{CATEGORY_LABELS[ticket.category]}</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
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
        </>
      ) : (
        /* Feedback tab */
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No feedback received yet.</p>
            </div>
          ) : (
            feedback.map((fb, i) => (
              <motion.div key={fb.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{fb.name || "Anonymous"}</span>
                          <Badge className="text-[10px] bg-gray-100 text-gray-600 capitalize">{fb.type}</Badge>
                          {fb.is_public && <Badge className="text-[10px] bg-green-100 text-green-700">Published</Badge>}
                        </div>
                        {fb.email && <p className="text-xs text-gray-500 mb-2">{fb.email}</p>}
                        <p className="text-sm text-gray-700">{fb.message}</p>
                        {fb.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: fb.rating }).map((_, j) => (
                              <span key={j} className="text-yellow-400 text-xs">★</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-4">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
