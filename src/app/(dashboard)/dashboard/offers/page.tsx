"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package, ArrowLeftRight, Check, X, Clock, Loader2, Inbox, Send
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
  sender: TradeProfile;
  receiver: TradeProfile;
  trade_items: TradeItem[];
}

type OfferTab = "incoming" | "outgoing";

export default function OffersPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OfferTab>("incoming");
  const [acting, setActing] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tradesRes, settingsRes] = await Promise.all([
        fetch("/api/trades?status=pending"),
        fetch("/api/settings"),
      ]);
      const tradesData = await tradesRes.json();
      const settingsData = await settingsRes.json();
      if (tradesData.trades) setTrades(tradesData.trades);
      if (settingsData.profile?.id) setCurrentUserId(settingsData.profile.id);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Also fetch countered trades
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/trades?status=countered");
        const data = await res.json();
        if (data.trades) {
          setTrades((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTrades = data.trades.filter((t: Trade) => !existingIds.has(t.id));
            return [...prev, ...newTrades];
          });
        }
      } catch {}
    })();
  }, []);

  const incoming = trades.filter((t) => t.receiver_id === currentUserId);
  const outgoing = trades.filter((t) => t.sender_id === currentUserId);
  const displayed = tab === "incoming" ? incoming : outgoing;

  const handleAction = async (tradeId: string, action: string) => {
    setActing(tradeId);
    try {
      await fetch(`/api/trades/${tradeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchData();
    } catch {
    } finally {
      setActing(null);
    }
  };

  const calcValue = (items: TradeItem[]): number => {
    return items.reduce((sum, i) => sum + (i.cards?.market_value || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trade Offers</h1>
        <p className="text-muted-foreground text-sm mt-1">View incoming and outgoing trade offers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => setTab("incoming")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
            tab === "incoming" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Incoming
          {incoming.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {incoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("outgoing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
            tab === "outgoing" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="h-4 w-4" />
          Outgoing
          {outgoing.length > 0 && (
            <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
              {outgoing.length}
            </span>
          )}
        </button>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">
              No {tab} offers
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              {tab === "incoming"
                ? "You haven't received any trade offers yet."
                : "You haven't sent any trade offers yet."}
            </p>
            {tab === "outgoing" && (
              <Link href="/dashboard/trades/new">
                <Button size="sm" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" /> Create Trade
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((trade) => {
            const other = tab === "incoming" ? trade.sender : trade.receiver;
            const senderItems = trade.trade_items.filter((i) => i.user_id === trade.sender_id);
            const receiverItems = trade.trade_items.filter((i) => i.user_id === trade.receiver_id);
            const offeredItems = tab === "incoming" ? senderItems : senderItems;
            const wantedItems = tab === "incoming" ? receiverItems : receiverItems;

            return (
              <Card key={trade.id}>
                <CardContent className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {(other?.display_name || other?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{other?.display_name || other?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        ⭐ {other?.trade_score?.toFixed(1) || "0.0"} · {new Date(trade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${
                      trade.status === "countered"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }`}>
                      {trade.status === "countered" ? "Countered" : "Pending"}
                    </Badge>
                  </div>

                  {/* Cards Preview */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {tab === "incoming" ? "They offer" : "You offer"} · ${calcValue(offeredItems).toFixed(2)}
                      </p>
                      <div className="flex -space-x-1">
                        {offeredItems.slice(0, 4).map((item) => (
                          <div key={item.id} className="h-14 w-10 rounded border border-border overflow-hidden bg-muted shrink-0">
                            {item.cards?.image_url && (
                              <Image src={item.cards.image_url} alt="" width={40} height={56} className="object-cover h-full w-full" />
                            )}
                          </div>
                        ))}
                        {offeredItems.length > 4 && (
                          <div className="h-14 w-10 rounded border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                            +{offeredItems.length - 4}
                          </div>
                        )}
                        {offeredItems.length === 0 && (
                          <p className="text-xs text-muted-foreground">No cards</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {tab === "incoming" ? "They want" : "You want"} · ${calcValue(wantedItems).toFixed(2)}
                      </p>
                      <div className="flex -space-x-1">
                        {wantedItems.slice(0, 4).map((item) => (
                          <div key={item.id} className="h-14 w-10 rounded border border-border overflow-hidden bg-muted shrink-0">
                            {item.cards?.image_url && (
                              <Image src={item.cards.image_url} alt="" width={40} height={56} className="object-cover h-full w-full" />
                            )}
                          </div>
                        ))}
                        {wantedItems.length > 4 && (
                          <div className="h-14 w-10 rounded border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                            +{wantedItems.length - 4}
                          </div>
                        )}
                        {wantedItems.length === 0 && (
                          <p className="text-xs text-muted-foreground">No cards</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {trade.notes && (
                    <p className="text-xs text-muted-foreground mb-3 bg-muted/50 p-2 rounded">
                      💬 {trade.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {tab === "incoming" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(trade.id, "accept")}
                          disabled={acting === trade.id}
                          className="gap-1"
                        >
                          {acting === trade.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Accept
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
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(trade.id, "cancel")}
                        disabled={acting === trade.id}
                        className="gap-1"
                      >
                        {acting === trade.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        Cancel
                      </Button>
                    )}
                    <Link href="/dashboard/trades" className="ml-auto">
                      <Button size="sm" variant="ghost" className="text-xs">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
