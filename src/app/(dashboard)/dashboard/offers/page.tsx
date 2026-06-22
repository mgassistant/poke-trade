"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package, ArrowLeftRight, Check, X, Clock, Loader2, Inbox, Send,
  DollarSign, Tag, MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

/* ---- Trade Offer Types ---- */
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

/* ---- Marketplace Offer Types ---- */
interface MarketplaceOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount: number;
  status: string;
  counter_amount: number | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  buyer: TradeProfile | null;
  listing?: {
    id: string;
    title: string;
    price: number;
    condition: string;
    user_id: string;
    card: { id: string; name: string; image_url: string | null } | null;
  };
}

type MainTab = "trades" | "marketplace";
type OfferTab = "incoming" | "outgoing";

const OFFER_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  accepted: { label: "Accepted", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  declined: { label: "Declined", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  countered: { label: "Countered", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  expired: { label: "Expired", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
};

export default function OffersPage() {
  const [mainTab, setMainTab] = useState<MainTab>("marketplace");
  const [tab, setTab] = useState<OfferTab>("incoming");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Trade offers
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // Marketplace offers
  const [myListingOffers, setMyListingOffers] = useState<MarketplaceOffer[]>([]);
  const [myOutgoingOffers, setMyOutgoingOffers] = useState<MarketplaceOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsData.profile?.id) setCurrentUserId(settingsData.profile.id);
    } catch {}
  }, []);

  const fetchTrades = useCallback(async () => {
    setLoadingTrades(true);
    try {
      const [pendingRes, counteredRes] = await Promise.all([
        fetch("/api/trades?status=pending"),
        fetch("/api/trades?status=countered"),
      ]);
      const pendingData = await pendingRes.json();
      const counteredData = await counteredRes.json();
      const all = [...(pendingData.trades || []), ...(counteredData.trades || [])];
      const unique = all.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
      setTrades(unique);
    } catch {
    } finally {
      setLoadingTrades(false);
    }
  }, []);

  const fetchMarketplaceOffers = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingOffers(true);
    try {
      // Fetch user's listings to get incoming offers
      const listingsRes = await fetch("/api/listings?mine=true&limit=50");
      const listingsData = await listingsRes.json();

      const allOffers: MarketplaceOffer[] = [];
      if (listingsData.listings) {
        for (const listing of listingsData.listings) {
          if (listing.status !== "active") continue;
          try {
            const offersRes = await fetch(`/api/listings/${listing.id}/offer`);
            const offersData = await offersRes.json();
            if (offersData.offers) {
              offersData.offers.forEach((o: MarketplaceOffer) => {
                o.listing = {
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  condition: listing.condition,
                  user_id: listing.user_id,
                  card: listing.card,
                };
              });
              allOffers.push(...offersData.offers);
            }
          } catch {}
        }
      }

      setMyListingOffers(allOffers.filter((o) => o.status === "pending" || o.status === "countered"));

      // TODO: In a production app, we'd have a dedicated API for outgoing offers
      // For now, filter from all offers
      setMyOutgoingOffers(allOffers.filter((o) => o.buyer_id === currentUserId));
    } catch {
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    if (currentUserId) fetchMarketplaceOffers();
  }, [currentUserId, fetchMarketplaceOffers]);

  // Trade offer actions
  const handleTradeAction = async (tradeId: string, action: string) => {
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

  // Marketplace offer actions
  const handleOfferAction = async (offer: MarketplaceOffer, action: string) => {
    setActing(offer.id);
    try {
      const body: Record<string, unknown> = { action, offer_id: offer.id };
      if (action === "counter") {
        const counterVal = counterAmounts[offer.id];
        if (!counterVal || parseFloat(counterVal) <= 0) {
          setActing(null);
          return;
        }
        body.counter_amount = parseFloat(counterVal);
      }

      await fetch(`/api/listings/${offer.listing_id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await fetchMarketplaceOffers();
    } catch {
    } finally {
      setActing(null);
    }
  };

  const incoming = trades.filter((t) => t.receiver_id === currentUserId);
  const outgoing = trades.filter((t) => t.sender_id === currentUserId);
  const displayedTrades = tab === "incoming" ? incoming : outgoing;

  const calcValue = (items: TradeItem[]): number => {
    return items.reduce((sum, i) => sum + (i.cards?.market_value || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Offers</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage trade and marketplace offers</p>
      </div>

      {/* Main Tabs: Trades vs Marketplace */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => setMainTab("marketplace")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
            mainTab === "marketplace" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Marketplace
          {myListingOffers.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{myListingOffers.length}</span>
          )}
        </button>
        <button
          onClick={() => setMainTab("trades")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
            mainTab === "trades" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Trades
          {trades.length > 0 && (
            <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">{trades.length}</span>
          )}
        </button>
      </div>

      {/* ============================================
          MARKETPLACE OFFERS
          ============================================ */}
      {mainTab === "marketplace" && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
            <button
              onClick={() => setTab("incoming")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                tab === "incoming" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Inbox className="h-4 w-4" /> Incoming
              {myListingOffers.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{myListingOffers.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab("outgoing")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                tab === "outgoing" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Send className="h-4 w-4" /> Outgoing
              {myOutgoingOffers.length > 0 && (
                <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">{myOutgoingOffers.length}</span>
              )}
            </button>
          </div>

          {loadingOffers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              {tab === "incoming" && (
                myListingOffers.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Inbox className="h-12 w-12 text-muted-foreground/20 mb-4" />
                      <h3 className="font-semibold mb-1">No incoming offers</h3>
                      <p className="text-sm text-muted-foreground">No one has made offers on your listings yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {myListingOffers.map((offer) => {
                      const statusBadge = OFFER_STATUS_BADGES[offer.status] || OFFER_STATUS_BADGES.pending;
                      return (
                        <Card key={offer.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Card Image */}
                              <div className="h-16 w-12 rounded overflow-hidden bg-muted relative shrink-0">
                                {offer.listing?.card?.image_url && (
                                  <Image src={offer.listing.card.image_url} alt="" fill className="object-contain" sizes="48px" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{offer.listing?.title}</p>
                                  <Badge variant="outline" className={`text-[10px] shrink-0 ${statusBadge.className}`}>
                                    {statusBadge.label}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>From: {offer.buyer?.display_name || offer.buyer?.username}</span>
                                  <span>·</span>
                                  <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center gap-3 mt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Asking</p>
                                    <p className="font-medium text-sm">${Number(offer.listing?.price || 0).toFixed(2)}</p>
                                  </div>
                                  <div className="text-muted-foreground">→</div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Offered</p>
                                    <p className="font-bold text-sm text-green-400">${Number(offer.amount).toFixed(2)}</p>
                                  </div>
                                  {offer.counter_amount && (
                                    <>
                                      <div className="text-muted-foreground">→</div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Counter</p>
                                        <p className="font-bold text-sm text-blue-400">${Number(offer.counter_amount).toFixed(2)}</p>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {offer.message && (
                                  <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded flex items-start gap-1.5">
                                    <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                    {offer.message}
                                  </p>
                                )}

                                {/* Actions */}
                                {(offer.status === "pending" || offer.status === "countered") && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={() => handleOfferAction(offer, "accept")}
                                      disabled={acting === offer.id}
                                      className="gap-1 h-7 text-xs"
                                    >
                                      {acting === offer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleOfferAction(offer, "decline")}
                                      disabled={acting === offer.id}
                                      className="gap-1 h-7 text-xs"
                                    >
                                      <X className="h-3 w-3" /> Decline
                                    </Button>
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Counter $"
                                        value={counterAmounts[offer.id] || ""}
                                        onChange={(e) => setCounterAmounts((prev) => ({ ...prev, [offer.id]: e.target.value }))}
                                        className="h-7 w-24 text-xs"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOfferAction(offer, "counter")}
                                        disabled={acting === offer.id || !counterAmounts[offer.id]}
                                        className="gap-1 h-7 text-xs"
                                      >
                                        Counter
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              )}

              {tab === "outgoing" && (
                myOutgoingOffers.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Send className="h-12 w-12 text-muted-foreground/20 mb-4" />
                      <h3 className="font-semibold mb-1">No outgoing offers</h3>
                      <p className="text-sm text-muted-foreground mb-4">Browse the marketplace to make offers!</p>
                      <Link href="/dashboard/marketplace">
                        <Button size="sm" className="gap-2">
                          <Tag className="h-4 w-4" /> Browse Marketplace
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {myOutgoingOffers.map((offer) => {
                      const statusBadge = OFFER_STATUS_BADGES[offer.status] || OFFER_STATUS_BADGES.pending;
                      return (
                        <Card key={offer.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-16 w-12 rounded overflow-hidden bg-muted relative shrink-0">
                                {offer.listing?.card?.image_url && (
                                  <Image src={offer.listing.card.image_url} alt="" fill className="object-contain" sizes="48px" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{offer.listing?.title}</p>
                                  <Badge variant="outline" className={`text-[10px] shrink-0 ${statusBadge.className}`}>
                                    {statusBadge.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Asking</p>
                                    <p className="font-medium text-sm">${Number(offer.listing?.price || 0).toFixed(2)}</p>
                                  </div>
                                  <div className="text-muted-foreground">→</div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Your Offer</p>
                                    <p className="font-bold text-sm text-green-400">${Number(offer.amount).toFixed(2)}</p>
                                  </div>
                                  {offer.counter_amount && (
                                    <>
                                      <div className="text-muted-foreground">→</div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Counter</p>
                                        <p className="font-bold text-sm text-blue-400">${Number(offer.counter_amount).toFixed(2)}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(offer.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================
          TRADE OFFERS (existing functionality)
          ============================================ */}
      {mainTab === "trades" && (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
            <button
              onClick={() => setTab("incoming")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                tab === "incoming" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Inbox className="h-4 w-4" /> Incoming
              {incoming.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{incoming.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab("outgoing")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                tab === "outgoing" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Send className="h-4 w-4" /> Outgoing
              {outgoing.length > 0 && (
                <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">{outgoing.length}</span>
              )}
            </button>
          </div>

          {loadingTrades ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : displayedTrades.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="font-semibold mb-1">No {tab} trade offers</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                  {tab === "incoming" ? "No pending trade offers." : "You haven't sent any trade offers yet."}
                </p>
                {tab === "outgoing" && (
                  <Link href="/dashboard/trades/new">
                    <Button size="sm" className="gap-2"><ArrowLeftRight className="h-4 w-4" /> Create Trade</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedTrades.map((trade) => {
                const other = tab === "incoming" ? trade.sender : trade.receiver;
                const senderItems = trade.trade_items.filter((i) => i.user_id === trade.sender_id);
                const receiverItems = trade.trade_items.filter((i) => i.user_id === trade.receiver_id);

                return (
                  <Card key={trade.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
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
                          trade.status === "countered" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }`}>
                          {trade.status === "countered" ? "Countered" : "Pending"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {tab === "incoming" ? "They offer" : "You offer"} · ${calcValue(senderItems).toFixed(2)}
                          </p>
                          <div className="flex -space-x-1">
                            {senderItems.slice(0, 4).map((item) => (
                              <div key={item.id} className="h-12 w-9 rounded border border-border overflow-hidden bg-muted shrink-0">
                                {item.cards?.image_url && (
                                  <Image src={item.cards.image_url} alt="" width={36} height={48} className="object-cover h-full w-full" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {tab === "incoming" ? "They want" : "You want"} · ${calcValue(receiverItems).toFixed(2)}
                          </p>
                          <div className="flex -space-x-1">
                            {receiverItems.slice(0, 4).map((item) => (
                              <div key={item.id} className="h-12 w-9 rounded border border-border overflow-hidden bg-muted shrink-0">
                                {item.cards?.image_url && (
                                  <Image src={item.cards.image_url} alt="" width={36} height={48} className="object-cover h-full w-full" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {tab === "incoming" ? (
                          <>
                            <Button size="sm" onClick={() => handleTradeAction(trade.id, "accept")} disabled={acting === trade.id} className="gap-1 h-7 text-xs">
                              {acting === trade.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleTradeAction(trade.id, "decline")} disabled={acting === trade.id} className="gap-1 h-7 text-xs">
                              <X className="h-3 w-3" /> Decline
                            </Button>
                            <Link href={`/dashboard/trades/new?counter=${trade.id}`}>
                              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                                <ArrowLeftRight className="h-3 w-3" /> Counter
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleTradeAction(trade.id, "cancel")} disabled={acting === trade.id} className="gap-1 h-7 text-xs">
                            {acting === trade.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
