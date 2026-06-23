"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Repeat, Plus, ChevronDown, ChevronUp, Check, X, ArrowLeftRight,
  Clock, CheckCircle, XCircle, RefreshCw, Loader2, Lock, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  trade_score: number;
  trader_level: number;
  trust_score: number | null;
  verification_level: number | null;
}

interface TradeCard {
  id: string;
  name: string;
  number: string;
  image_url: string | null;
  market_value: number | null;
  card_sets: { name: string } | null;
}

interface TradeItem {
  id: string;
  user_id: string;
  card_id: string;
  cards: TradeCard;
}

interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  cash_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
  auto_cancel_at: string | null;
  fee_amount: number | null;
  fee_per_party: number | null;
  protection_amount: number | null;
  sender: TradeProfile;
  receiver: TradeProfile;
  trade_items: TradeItem[];
}

type Tab = "active" | "pending" | "completed" | "declined";

const TAB_CONFIG: { key: Tab; label: string; statuses: string[]; icon: React.ElementType }[] = [
  { key: "active", label: "Active", statuses: ["accepted", "agreed", "in_transit", "locked", "shipped", "awaiting_shipment"], icon: RefreshCw },
  { key: "pending", label: "Pending", statuses: ["pending", "countered"], icon: Clock },
  { key: "completed", label: "Completed", statuses: ["completed"], icon: CheckCircle },
  { key: "declined", label: "Declined", statuses: ["declined", "cancelled"], icon: XCircle },
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  countered: { label: "Countered", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  accepted: { label: "Accepted", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  agreed: { label: "Agreed", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  locked: { label: "🔒 LOCKED", className: "bg-red-500/20 text-red-400 border-red-500/30 font-bold" },
  shipped: { label: "Shipped", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  declined: { label: "Declined", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  cancelled: { label: "Cancelled", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  in_transit: { label: "📦 In Transit", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  disputed: { label: "⚠️ Disputed", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  awaiting_shipment: { label: "Awaiting Shipment", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

/* Countdown timer component */
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        setUrgent(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }

      setUrgent(days < 2);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={`text-xs font-medium ${urgent ? "text-red-500" : "text-orange-500"}`}>
      ⏳ Ship within {timeLeft}
    </span>
  );
}

/* Trade progress stepper */
function TradeProgressBar({ status }: { status: string }) {
  const steps = ["Accepted", "Locked", "Shipped", "In Transit", "Delivered", "Complete"];
  const statusMap: Record<string, number> = {
    accepted: 0, locked: 1, shipped: 2, awaiting_shipment: 2,
    in_transit: 3, delivered: 4, completed: 5,
  };
  const currentStep = statusMap[status] ?? 0;

  return (
    <div className="flex items-center gap-0.5 w-full">
      {steps.map((s, idx) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${
            idx <= currentStep ? "bg-green-500" : "bg-gray-200"
          }`} />
        </div>
      ))}
    </div>
  );
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/trades");
      const data = await res.json();
      if (data.trades) setTrades(data.trades);
      if (data.trades?.length > 0) {
        const ids = new Set<string>();
        data.trades.forEach((tr: Trade) => {
          ids.add(tr.sender_id);
          ids.add(tr.receiver_id);
        });
        const allIds = Array.from(ids);
        for (const uid of allIds) {
          if (data.trades.every((tr: Trade) => tr.sender_id === uid || tr.receiver_id === uid)) {
            setCurrentUserId(uid);
            break;
          }
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.profile?.id) setCurrentUserId(data.profile.id);
      } catch {}
    })();
  }, []);

  const tabStatuses = TAB_CONFIG.find((t) => t.key === activeTab)?.statuses || [];
  const filtered = trades.filter((t) => tabStatuses.includes(t.status));

  const tabCounts = TAB_CONFIG.reduce((acc, tab) => {
    acc[tab.key] = trades.filter((t) => tab.statuses.includes(t.status)).length;
    return acc;
  }, {} as Record<Tab, number>);

  const handleAction = async (tradeId: string, action: string) => {
    setActing(tradeId);
    try {
      await fetch(`/api/trades/${tradeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchTrades();
    } catch {
    } finally {
      setActing(null);
    }
  };

  const getOtherParty = (trade: Trade): TradeProfile => {
    return trade.sender_id === currentUserId ? trade.receiver : trade.sender;
  };

  const getMyItems = (trade: Trade): TradeItem[] => {
    return (trade.trade_items || []).filter((i) => i.user_id === currentUserId);
  };

  const getTheirItems = (trade: Trade): TradeItem[] => {
    return (trade.trade_items || []).filter((i) => i.user_id !== currentUserId);
  };

  const calcValue = (items: TradeItem[]): number => {
    return items.reduce((sum, i) => sum + (i.cards?.market_value || 0), 0);
  };

  const isLockedStatus = (status: string) =>
    ["locked", "shipped", "in_transit", "awaiting_shipment"].includes(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Trades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your active trades, counter offers, and trade history
          </p>
        </div>
        <Link href="/dashboard/trades/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Trade
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trade List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Repeat className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No {activeTab} trades</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              {activeTab === "pending"
                ? "Send a trade offer to get started!"
                : `You don't have any ${activeTab} trades yet.`}
            </p>
            {activeTab === "pending" && (
              <Link href="/dashboard/trades/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Create Trade
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => {
            const other = getOtherParty(trade);
            const myItems = getMyItems(trade);
            const theirItems = getTheirItems(trade);
            const isExpanded = expandedId === trade.id;
            const isSender = trade.sender_id === currentUserId;
            const isPending = trade.status === "pending" || trade.status === "countered";
            const isLocked = isLockedStatus(trade.status);
            const statusBadge = STATUS_BADGES[trade.status] || STATUS_BADGES.pending;

            return (
              <Card key={trade.id} className={`overflow-hidden ${isLocked ? "border-red-300" : ""}`}>
                <CardContent className="p-0">
                  {/* Trade Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {(other?.display_name || other?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                      {isLocked && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                          <Lock className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {other?.display_name || other?.username || "Unknown"}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${statusBadge.className}`}>
                          {statusBadge.label}
                        </Badge>
                        {!isSender && isPending && (
                          <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                            Received
                          </Badge>
                        )}
                        {trade.protection_amount && trade.protection_amount > 0 && (
                          <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <Shield className="h-2.5 w-2.5 mr-0.5" /> ${trade.protection_amount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{myItems.length} card{myItems.length !== 1 ? "s" : ""} offered</span>
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>{theirItems.length} card{theirItems.length !== 1 ? "s" : ""} requested</span>
                        <span className="ml-2">
                          {new Date(trade.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Countdown for locked trades */}
                      {isLocked && trade.auto_cancel_at && (
                        <CountdownTimer targetDate={trade.auto_cancel_at} />
                      )}
                    </div>

                    {/* Card Thumbnails */}
                    <div className="hidden sm:flex items-center -space-x-2">
                      {(myItems.slice(0, 3)).map((item) => (
                        <div key={item.id} className="h-10 w-7 rounded border border-border overflow-hidden bg-muted">
                          {item.cards?.image_url && (
                            <Image src={item.cards.image_url} alt="" width={28} height={40} className="object-cover h-full w-full" />
                          )}
                        </div>
                      ))}
                      {myItems.length > 3 && (
                        <div className="h-10 w-7 rounded border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                          +{myItems.length - 3}
                        </div>
                      )}
                    </div>

                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* Progress bar for active trades */}
                      {isLocked && (
                        <div className="px-4 pt-3">
                          <TradeProgressBar status={trade.status} />
                          <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-1">
                            <span>Accepted</span>
                            <span>Locked</span>
                            <span>Shipped</span>
                            <span>In Transit</span>
                            <span>Delivered</span>
                            <span>Complete</span>
                          </div>
                        </div>
                      )}

                      {/* Reserved cards warning */}
                      {isLocked && (
                        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 flex items-center gap-1.5">
                            <Lock className="h-3 w-3" />
                            <strong>Cards are reserved for this trade</strong> — they cannot be listed or included in other trades
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                        <div className="p-4 md:border-r border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            {isSender ? "You Offer" : "They Offer"} · ${calcValue(isSender ? myItems : theirItems).toFixed(2)}
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {(isSender ? myItems : theirItems).map((item) => (
                              <div key={item.id} className="group">
                                <div className={`aspect-[2.5/3.5] rounded-md overflow-hidden bg-muted relative ${isLocked ? "ring-1 ring-red-300" : ""}`}>
                                  {item.cards?.image_url ? (
                                    <Image src={item.cards.image_url} alt={item.cards.name} fill className="object-contain" sizes="80px" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Repeat className="h-4 w-4 text-muted-foreground/30" />
                                    </div>
                                  )}
                                  {isLocked && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center">
                                      <Lock className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] truncate mt-1">{item.cards?.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  ${(item.cards?.market_value || 0).toFixed(2)}
                                </p>
                              </div>
                            ))}
                            {(isSender ? myItems : theirItems).length === 0 && (
                              <p className="text-xs text-muted-foreground col-span-full">No cards</p>
                            )}
                          </div>
                        </div>
                        <div className="p-4 border-t md:border-t-0 border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            {isSender ? "You Want" : "They Want"} · ${calcValue(isSender ? theirItems : myItems).toFixed(2)}
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {(isSender ? theirItems : myItems).map((item) => (
                              <div key={item.id} className="group">
                                <div className={`aspect-[2.5/3.5] rounded-md overflow-hidden bg-muted relative ${isLocked ? "ring-1 ring-red-300" : ""}`}>
                                  {item.cards?.image_url ? (
                                    <Image src={item.cards.image_url} alt={item.cards.name} fill className="object-contain" sizes="80px" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Repeat className="h-4 w-4 text-muted-foreground/30" />
                                    </div>
                                  )}
                                  {isLocked && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center">
                                      <Lock className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] truncate mt-1">{item.cards?.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  ${(item.cards?.market_value || 0).toFixed(2)}
                                </p>
                              </div>
                            ))}
                            {(isSender ? theirItems : myItems).length === 0 && (
                              <p className="text-xs text-muted-foreground col-span-full">No cards</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fee & Protection info */}
                      {(trade.fee_amount || trade.protection_amount) && (
                        <div className="px-4 pb-3 border-t border-border pt-3 flex flex-wrap gap-3">
                          {trade.fee_amount && trade.fee_amount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              💰 Fee: ${trade.fee_amount.toFixed(2)} (${trade.fee_per_party?.toFixed(2)}/each)
                            </div>
                          )}
                          {trade.protection_amount && trade.protection_amount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              🛡️ Protection: ${trade.protection_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {trade.notes && (
                        <div className="px-4 pb-3 border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground">Note: {trade.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div className="flex flex-wrap gap-2 px-4 pb-4 border-t border-border pt-3">
                          {!isSender && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAction(trade.id, "accept")}
                                disabled={acting === trade.id}
                                className="gap-1"
                              >
                                {acting === trade.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Accept &amp; Lock 🔒
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(trade.id, "decline")}
                                disabled={acting === trade.id}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" /> Decline
                              </Button>
                              <Link href={`/dashboard/trades/new?counter=${trade.id}`}>
                                <Button size="sm" variant="outline" className="gap-1">
                                  <ArrowLeftRight className="h-3 w-3" /> Counter
                                </Button>
                              </Link>
                            </>
                          )}
                          {isSender && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(trade.id, "cancel")}
                              disabled={acting === trade.id}
                              className="gap-1"
                            >
                              {acting === trade.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              Cancel Trade
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Locked trade: shipping workflow */}
                      {isLocked && (
                        <div className="flex flex-wrap gap-2 px-4 pb-4 border-t border-border pt-3">
                          <Link href={`/dashboard/trades/${trade.id}/shipping`}>
                            <Button size="sm" className="gap-1 bg-[#E3350D] hover:bg-[#c72e0b]">
                              📦 Upload Shipping &amp; Tracking
                            </Button>
                          </Link>
                          <p className="text-xs text-muted-foreground w-full mt-1">
                            ⏳ Trade Locked — Upload shipping confirmation to continue
                          </p>
                        </div>
                      )}

                      {/* Accepted but not locked (legacy compat) */}
                      {trade.status === "accepted" && (
                        <div className="flex flex-wrap gap-2 px-4 pb-4 border-t border-border pt-3">
                          <Link href={`/dashboard/trades/${trade.id}/shipping`}>
                            <Button size="sm" className="gap-1 bg-[#E3350D] hover:bg-[#c72e0b]">
                              📦 Shipping Workflow
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* In transit */}
                      {trade.status === "in_transit" && (
                        <div className="flex flex-wrap gap-2 px-4 pb-4 border-t border-border pt-3">
                          <Link href={`/dashboard/trades/${trade.id}/shipping`}>
                            <Button size="sm" className="gap-1 bg-[#E3350D] hover:bg-[#c72e0b]">
                              📦 Track &amp; Confirm Receipt
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* Review for completed */}
                      {trade.status === "completed" && (
                        <div className="flex flex-wrap gap-2 px-4 pb-4 border-t border-border pt-3">
                          <Link href={`/dashboard/reviews?trade=${trade.id}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              ⭐ Leave Review
                            </Button>
                          </Link>
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
