"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Search, X, Check, ArrowLeftRight,
  Loader2, AlertTriangle, Wallet, User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  trade_score: number;
  trader_level: number;
  total_trades: number;
}

interface CardItem {
  id: string;
  card_id: string;
  collection_item_id?: string;
  quantity: number;
  condition: string;
  current_value: number | null;
  cards: {
    id: string;
    name: string;
    number: string;
    image_url: string | null;
    market_value: number | null;
    rarity: string | null;
    card_type: string | null;
    card_sets: { name: string; symbol_url: string | null } | null;
  };
}

type Step = 1 | 2 | 3 | 4;

function NewTradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const counterId = searchParams.get("counter");

  const [step, setStep] = useState<Step>(1);

  // Step 1: Search user
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Step 2: My cards
  const [myCards, setMyCards] = useState<CardItem[]>([]);
  const [myCardsLoading, setMyCardsLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CardItem[]>([]);
  const [mySearch, setMySearch] = useState("");

  // Step 3: Their cards
  const [theirCards, setTheirCards] = useState<CardItem[]>([]);
  const [theirCardsLoading, setTheirCardsLoading] = useState(false);
  const [selectedWant, setSelectedWant] = useState<CardItem[]>([]);
  const [theirSearch, setTheirSearch] = useState("");

  // Step 4: Review
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search users
  useEffect(() => {
    if (!userQuery.trim() || userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userQuery)}`);
        const data = await res.json();
        if (data.users) setUserResults(data.users);
      } catch {
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  // Fetch my collection when entering step 2
  const fetchMyCards = useCallback(async () => {
    setMyCardsLoading(true);
    try {
      const res = await fetch("/api/collection");
      const data = await res.json();
      if (data.collections) {
        const items = data.collections.flatMap((c: { collection_items: CardItem[] }) =>
          (c.collection_items || []).map((item: CardItem) => ({
            ...item,
            collection_item_id: item.id,
          }))
        );
        setMyCards(items);
      }
    } catch {
    } finally {
      setMyCardsLoading(false);
    }
  }, []);

  // Fetch their collection when entering step 3
  const fetchTheirCards = useCallback(async () => {
    if (!selectedUser) return;
    setTheirCardsLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/collection`);
      const data = await res.json();
      if (data.items) {
        setTheirCards(data.items.map((item: CardItem) => ({
          ...item,
          collection_item_id: item.id,
        })));
      }
    } catch {
    } finally {
      setTheirCardsLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (step === 2) fetchMyCards();
  }, [step, fetchMyCards]);

  useEffect(() => {
    if (step === 3) fetchTheirCards();
  }, [step, fetchTheirCards]);

  const toggleOffer = (item: CardItem) => {
    setSelectedOffer((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };

  const toggleWant = (item: CardItem) => {
    setSelectedWant((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };

  const offerValue = selectedOffer.reduce((sum, i) => sum + (i.cards?.market_value || i.current_value || 0), 0);
  const wantValue = selectedWant.reduce((sum, i) => sum + (i.cards?.market_value || i.current_value || 0), 0);
  const valueDiff = offerValue - wantValue;

  const filterCards = (items: CardItem[], query: string) => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter((i) => i.cards?.name?.toLowerCase().includes(lower));
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload = {
        receiver_id: selectedUser.id,
        items_offered: selectedOffer.map((i) => ({
          card_id: i.cards.id || i.card_id,
          collection_item_id: i.collection_item_id,
        })),
        items_wanted: selectedWant.map((i) => ({
          card_id: i.cards.id || i.card_id,
          collection_item_id: i.collection_item_id,
        })),
        notes: notes || null,
      };

      let res;
      if (counterId) {
        // Counter offer
        res = await fetch(`/api/trades/${counterId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "counter",
            ...payload,
          }),
        });
      } else {
        res = await fetch("/api/trades/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/trades");
      } else {
        alert(data.error || "Failed to create trade");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {counterId ? "Counter Offer" : "New Trade"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step {step} of 4
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* ===== STEP 1: Select User ===== */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" /> Find a Trading Partner
            </h2>

            {selectedUser ? (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <Image src={selectedUser.avatar_url} alt="" width={48} height={48} className="object-cover" />
                  ) : (
                    <span className="font-bold text-muted-foreground">
                      {(selectedUser.display_name || selectedUser.username)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedUser.display_name || selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground">
                    @{selectedUser.username} · ⭐ {selectedUser.trade_score.toFixed(1)} · {selectedUser.total_trades} trades
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  <X className="h-4 w-4" /> Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search by username..."
                    className="pl-10"
                    autoFocus
                  />
                </div>

                <div className="mt-4 space-y-1 max-h-64 overflow-y-auto">
                  {searchingUsers ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {userQuery.length >= 2 ? "No users found" : "Type at least 2 characters to search"}
                    </p>
                  ) : (
                    userResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setUserQuery(""); setUserResults([]); }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt="" width={40} height={40} className="object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              {(u.display_name || u.username)[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.display_name || u.username}</p>
                          <p className="text-xs text-muted-foreground">
                            @{u.username} · ⭐ {u.trade_score.toFixed(1)} · {u.total_trades} trades
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedUser}
                className="gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== STEP 2: Select Your Cards ===== */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Select Cards to Offer
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose cards from your collection ({selectedOffer.length} selected · ${offerValue.toFixed(2)})
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mySearch}
                onChange={(e) => setMySearch(e.target.value)}
                placeholder="Filter your cards..."
                className="pl-10"
              />
            </div>

            {myCardsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[2.5/3.5] rounded-md" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                ))}
              </div>
            ) : filterCards(myCards, mySearch).length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No cards in your collection</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                {filterCards(myCards, mySearch).map((item) => {
                  const isSelected = selectedOffer.some((i) => i.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleOffer(item)}
                      className={`text-left rounded-lg p-1.5 transition-all ${
                        isSelected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="aspect-[2.5/3.5] rounded-md overflow-hidden bg-muted relative">
                        {item.cards?.image_url ? (
                          <Image src={item.cards.image_url} alt={item.cards.name} fill className="object-contain" sizes="100px" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] truncate mt-1">{item.cards?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ${(item.cards?.market_value || 0).toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== STEP 3: Select Their Cards ===== */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" /> Select Cards You Want
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              From {selectedUser?.display_name || selectedUser?.username}&apos;s collection ({selectedWant.length} selected · ${wantValue.toFixed(2)})
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={theirSearch}
                onChange={(e) => setTheirSearch(e.target.value)}
                placeholder="Filter their cards..."
                className="pl-10"
              />
            </div>

            {theirCardsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[2.5/3.5] rounded-md" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                ))}
              </div>
            ) : filterCards(theirCards, theirSearch).length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {theirCards.length === 0
                    ? "This user hasn't made their collection public yet"
                    : "No cards match your search"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                {filterCards(theirCards, theirSearch).map((item) => {
                  const isSelected = selectedWant.some((i) => i.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleWant(item)}
                      className={`text-left rounded-lg p-1.5 transition-all ${
                        isSelected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="aspect-[2.5/3.5] rounded-md overflow-hidden bg-muted relative">
                        {item.cards?.image_url ? (
                          <Image src={item.cards.image_url} alt={item.cards.name} fill className="object-contain" sizes="100px" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] truncate mt-1">{item.cards?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ${(item.cards?.market_value || 0).toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)} className="gap-2">
                Review <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== STEP 4: Review & Submit ===== */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Fair Trade Indicator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">You Offer</p>
                  <p className="text-lg font-bold">${offerValue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{selectedOffer.length} card{selectedOffer.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="px-4">
                  <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">You Want</p>
                  <p className="text-lg font-bold">${wantValue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{selectedWant.length} card{selectedWant.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-center">
                {Math.abs(valueDiff) < 1 ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    ✅ Fair Trade
                  </Badge>
                ) : valueDiff > 0 ? (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    You're offering ${valueDiff.toFixed(2)} more
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    You're requesting ${Math.abs(valueDiff).toFixed(2)} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Your Offer</h3>
                <div className="space-y-2">
                  {selectedOffer.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-9 rounded overflow-hidden bg-muted relative shrink-0">
                        {item.cards?.image_url && (
                          <Image src={item.cards.image_url} alt="" fill className="object-contain" sizes="36px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.cards?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.cards?.card_sets?.name}</p>
                      </div>
                      <span className="text-sm font-medium">${(item.cards?.market_value || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedOffer.length === 0 && (
                    <p className="text-sm text-muted-foreground">No cards selected</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">You Want</h3>
                <div className="space-y-2">
                  {selectedWant.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-9 rounded overflow-hidden bg-muted relative shrink-0">
                        {item.cards?.image_url && (
                          <Image src={item.cards.image_url} alt="" fill className="object-contain" sizes="36px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.cards?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.cards?.card_sets?.name}</p>
                      </div>
                      <span className="text-sm font-medium">${(item.cards?.market_value || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedWant.length === 0 && (
                    <p className="text-sm text-muted-foreground">No cards selected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardContent className="p-4">
              <label className="text-sm font-medium mb-2 block">Message (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a message to your trade offer..."
                className="w-full h-20 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground resize-none"
                maxLength={500}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (selectedOffer.length === 0 && selectedWant.length === 0)}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {counterId ? "Send Counter Offer" : "Send Trade Offer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewTradePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">New Trade</h1></div>
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <NewTradeContent />
    </Suspense>
  );
}
