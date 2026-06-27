"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Search, X, Check, Loader2, User, Package, MessageSquare, Eye,
  Plus, Shield, Truck, Lock, DollarSign
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PROTECTION_DISCLAIMER } from "@/lib/protection-program";
import { getTraderLevel, getMaxTradeValue } from "@/lib/constants";

/* ── Types ── */
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
  reserved_for_trade_id?: string | null;
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

type Step = 1 | 2 | 3 | 4 | 5;
type ShippingMethod = "direct" | "protected";

const STEP_LABELS = [
  { num: 1, label: "Partner", icon: User },
  { num: 2, label: "Cards", icon: Plus },
  { num: 3, label: "Shipping", icon: Package },
  { num: 4, label: "Message", icon: MessageSquare },
  { num: 5, label: "Review", icon: Eye },
];

/* ── Fee Calculation (mirrors server logic) ── */
type MembershipTier = "free" | "pro" | "elite";

const PROTECTION_CONFIGS: Record<MembershipTier, { feeMinimum: number; feeRate: number; maxBenefit: number }> = {
  free: { feeMinimum: 5.99, feeRate: 0.05, maxBenefit: 0 },
  pro: { feeMinimum: 3.99, feeRate: 0.03, maxBenefit: 50 },
  elite: { feeMinimum: 3.99, feeRate: 0.03, maxBenefit: 100 },
};

function calculateFee(tradeValue: number, tier: MembershipTier): {
  total: number; perParty: number; method: string;
  feeMinimum: number; feeRate: number; maxBenefit: number;
} {
  const config = PROTECTION_CONFIGS[tier];
  const pct = tradeValue * config.feeRate;
  const total = Math.max(config.feeMinimum, pct);
  return {
    total: Math.round(total * 100) / 100,
    perParty: Math.round((total / 2) * 100) / 100,
    method: pct > config.feeMinimum ? `${config.feeRate * 100}%` : `flat $${config.feeMinimum}`,
    feeMinimum: config.feeMinimum,
    feeRate: config.feeRate,
    maxBenefit: config.maxBenefit,
  };
}

/* ── Balance Scale Component ── */
function BalanceScale({ offerValue, wantValue }: { offerValue: number; wantValue: number }) {
  const total = offerValue + wantValue;
  const diff = total > 0 ? ((offerValue - wantValue) / Math.max(total, 1)) * 100 : 0;
  const angle = Math.max(-25, Math.min(25, diff * 0.5));
  const absDiff = Math.abs(diff);

  let status: { label: string; color: string; glow: string };
  if (total === 0) {
    status = { label: "Add cards to begin!", color: "#9CA3AF", glow: "none" };
  } else if (absDiff < 10) {
    status = { label: "Fair Trade! ⚖️", color: "#10B981", glow: "0 0 20px rgba(16,185,129,0.4)" };
  } else if (absDiff < 30) {
    status = { label: "Close enough! 🤝", color: "#F59E0B", glow: "0 0 20px rgba(245,158,11,0.3)" };
  } else {
    status = { label: "Uneven trade ⚠️", color: "#EF4444", glow: "0 0 20px rgba(239,68,68,0.3)" };
  }

  const leftEmoji = diff > 15 ? "😟" : diff > 5 ? "😐" : "😊";
  const rightEmoji = diff < -15 ? "😟" : diff < -5 ? "😐" : "😊";

  return (
    <div className="flex flex-col items-center py-4 select-none">
      <div
        className="text-sm font-bold mb-3 px-4 py-1.5 rounded-full transition-all duration-500"
        style={{ color: status.color, background: `${status.color}15`, boxShadow: status.glow }}
      >
        {status.label}
      </div>
      <div className="relative w-full max-w-xs h-36">
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 z-10">
          <div className="w-10 h-10 rounded-full border-[3px] border-gray-800 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#E3350D]" />
            <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-gray-800 -translate-y-1/2 z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-[2px] border-gray-800 bg-white z-20" />
          </div>
          <div className="w-2 h-6 bg-gray-400 mx-auto rounded-b" />
          <div className="w-12 h-2 bg-gray-400 rounded-full mx-auto -mt-0.5" />
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-10 w-64 origin-center transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        >
          <div className="h-2 bg-[#FFCB05] rounded-full shadow-md border border-yellow-600/30" />
          <div className="absolute -left-4 -top-1">
            <div className="w-1 h-8 bg-gray-500 mx-auto" />
            <div className="w-16 h-3 bg-gray-300 rounded-b-lg border border-gray-400 shadow-inner mx-auto -mt-0.5" />
            <div className="text-center mt-1">
              <span className="text-lg">{total > 0 ? leftEmoji : "📥"}</span>
            </div>
          </div>
          <div className="absolute -right-4 -top-1">
            <div className="w-1 h-8 bg-gray-500 mx-auto" />
            <div className="w-16 h-3 bg-gray-300 rounded-b-lg border border-gray-400 shadow-inner mx-auto -mt-0.5" />
            <div className="text-center mt-1">
              <span className="text-lg">{total > 0 ? rightEmoji : "📤"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Your Offer</p>
          <p className="text-lg font-bold text-[#E3350D]">${offerValue.toFixed(2)}</p>
        </div>
        <div className="text-2xl">⚡</div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">You Want</p>
          <p className="text-lg font-bold text-[#3B4CCA]">${wantValue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Card Slot Grid ── */
function CardSlotGrid({
  items,
  onRemove,
  emptyLabel,
  accentColor,
}: {
  items: CardItem[];
  onRemove: (id: string) => void;
  emptyLabel: string;
  accentColor: string;
}) {
  if (items.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item) => (
        <div key={item.id} className="relative group">
          <div
            className="aspect-[2.5/3.5] rounded-lg overflow-hidden bg-muted border-2 transition-colors"
            style={{ borderColor: accentColor + "40" }}
          >
            {item.cards?.image_url ? (
              <Image
                src={item.cards.image_url}
                alt={item.cards.name}
                fill
                className="object-contain"
                sizes="100px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                {item.cards?.name?.[0] || "?"}
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-xs"
          >
            ×
          </button>
          <p className="text-[10px] truncate mt-0.5 font-medium">{item.cards?.name}</p>
          <p className="text-[9px] text-muted-foreground">${(item.cards?.market_value || 0).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Collection Browser Modal ── */
function CollectionBrowser({
  items,
  selectedIds,
  onToggle,
  onClose,
  loading,
  title,
}: {
  items: CardItem[];
  selectedIds: Set<string>;
  onToggle: (item: CardItem) => void;
  onClose: () => void;
  loading: boolean;
  title: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    // Filter out reserved cards
    const available = items.filter((i) => !i.reserved_for_trade_id);
    if (!search) return available;
    const q = search.toLowerCase();
    return available.filter((i) => i.cards?.name?.toLowerCase().includes(q));
  }, [items, search]);

  const reservedCount = items.filter((i) => i.reserved_for_trade_id).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="pl-10"
              autoFocus
            />
          </div>
          {reservedCount > 0 && (
            <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
              <Lock className="h-3 w-3" /> {reservedCount} card{reservedCount !== 1 ? "s" : ""} reserved for other trades (hidden)
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[2.5/3.5] rounded-md" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {items.length === 0 ? "No cards available" : "No matches found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item)}
                    className={`text-left rounded-lg p-1.5 transition-all ${
                      isSelected ? "ring-2 ring-[#E3350D] bg-red-50" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="aspect-[2.5/3.5] rounded-md overflow-hidden bg-muted relative">
                      {item.cards?.image_url ? (
                        <Image
                          src={item.cards.image_url}
                          alt={item.cards.name}
                          fill
                          className="object-contain"
                          sizes="100px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-xs">
                          ?
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-[#E3350D] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] truncate mt-1 font-medium">{item.cards?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ${(item.cards?.market_value || 0).toFixed(2)}
                      {item.cards?.card_sets?.name && (
                        <span className="ml-1">· {item.cards.card_sets.name}</span>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-muted/30">
          <Button onClick={onClose} className="w-full bg-[#E3350D] hover:bg-[#c72e0b]">
            Done ({selectedIds.size} selected)
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Content ── */
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

  // Step 2: Cards
  const [myCards, setMyCards] = useState<CardItem[]>([]);
  const [myCardsLoading, setMyCardsLoading] = useState(false);
  const [theirCards, setTheirCards] = useState<CardItem[]>([]);
  const [theirCardsLoading, setTheirCardsLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CardItem[]>([]);
  const [selectedWant, setSelectedWant] = useState<CardItem[]>([]);
  const [browsingCollection, setBrowsingCollection] = useState<"mine" | "theirs" | null>(null);

  // Step 3: Shipping & Protection
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("direct");
  const [protectionTermsAccepted, setProtectionTermsAccepted] = useState(false);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("free");

  // Step 4: Message
  const [notes, setNotes] = useState("");
  const [cashOffer, setCashOffer] = useState(0); // Cash YOU add to sweeten your side
  const [cashWant, setCashWant] = useState(0);   // Cash you WANT from them

  // Step 5: Submit
  const [submitting, setSubmitting] = useState(false);

  // Trade limits
  const [userTotalTrades, setUserTotalTrades] = useState(0);
  const [userTraderLevel, setUserTraderLevel] = useState(getTraderLevel(0));
  const [maxTradeValue, setMaxTradeValue] = useState(25);

  // Values
  const offerCardsValue = selectedOffer.reduce(
    (sum, i) => sum + (i.cards?.market_value || i.current_value || 0), 0
  );
  const wantCardsValue = selectedWant.reduce(
    (sum, i) => sum + (i.cards?.market_value || i.current_value || 0), 0
  );
  const offerValue = offerCardsValue + cashOffer;
  const wantValue = wantCardsValue + cashWant;
  const totalTradeValue = offerValue + wantValue;

  // Fee calculation
  const fee = useMemo(() => calculateFee(totalTradeValue, membershipTier), [totalTradeValue, membershipTier]);

  const offerIds = useMemo(() => new Set(selectedOffer.map((i) => i.id)), [selectedOffer]);
  const wantIds = useMemo(() => new Set(selectedWant.map((i) => i.id)), [selectedWant]);

  // Fetch membership tier and user profile for trade limits
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/membership");
        const data = await res.json();
        if (data.tier) setMembershipTier(data.tier);
      } catch {}
    })();
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        const totalTrades = data.profile?.total_trades || 0;
        setUserTotalTrades(totalTrades);
        const level = getTraderLevel(totalTrades);
        setUserTraderLevel(level);
        setMaxTradeValue(getMaxTradeValue(totalTrades));
      } catch {}
    })();
  }, []);

  const isOverTradeLimit = maxTradeValue !== Infinity && totalTradeValue > maxTradeValue;
  const isPokemonMaster = maxTradeValue === Infinity;

  // Search users
  useEffect(() => {
    if (!userQuery.trim() || userQuery.length < 2) { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userQuery)}`);
        const data = await res.json();
        if (data.users) setUserResults(data.users);
      } catch {} finally { setSearchingUsers(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  // Fetch collections
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
    } catch {} finally { setMyCardsLoading(false); }
  }, []);

  const fetchTheirCards = useCallback(async () => {
    if (!selectedUser) return;
    setTheirCardsLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/collection`);
      const data = await res.json();
      if (data.items) {
        setTheirCards(
          data.items.map((item: CardItem) => ({ ...item, collection_item_id: item.id }))
        );
      }
    } catch {} finally { setTheirCardsLoading(false); }
  }, [selectedUser]);

  useEffect(() => {
    if (step === 2) { fetchMyCards(); fetchTheirCards(); }
  }, [step, fetchMyCards, fetchTheirCards]);

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

  // Reset protection terms when switching shipping method
  useEffect(() => {
    if (shippingMethod === "direct") {
      setProtectionTermsAccepted(false);
    }
  }, [shippingMethod]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    if (shippingMethod === "protected" && !protectionTermsAccepted) {
      alert("You must accept the Trade Protection terms before proceeding.");
      return;
    }
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
        shipping_method: shippingMethod,
        trade_protection_selected: shippingMethod === "protected",
        declared_trade_value: totalTradeValue,
        cash_offer: cashOffer || 0,
        cash_want: cashWant || 0,
        protection_terms_accepted: shippingMethod === "protected" ? protectionTermsAccepted : false,
      };

      let res;
      if (counterId) {
        res = await fetch(`/api/trades/${counterId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "counter", ...payload }),
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

  const traderLevelName = (level: number) => {
    const names = ["Rookie", "Trainer", "Ace", "Elite", "Champion", "Master"];
    return names[Math.min(level, names.length - 1)] || "Rookie";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🎮 {counterId ? "Counter Offer" : "Pokétopia Trade Center"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create the perfect trade deal
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEP_LABELS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.num === step;
          const isDone = s.num < step;
          return (
            <div key={s.num} className="flex items-center">
              {idx > 0 && (
                <div
                  className={`w-6 sm:w-10 h-0.5 mx-0.5 transition-colors ${
                    isDone ? "bg-[#E3350D]" : "bg-gray-200"
                  }`}
                />
              )}
              <button
                onClick={() => { if (isDone) setStep(s.num as Step); }}
                disabled={!isDone && !isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#E3350D] text-white shadow-md"
                    : isDone
                    ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ═══════════ STEP 1: Find Partner ═══════════ */}
      {step === 1 && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-[#E3350D] to-[#c72e0b] p-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Find Your Trading Partner
            </h2>
            <p className="text-white/80 text-sm">Search by username to start a trade</p>
          </div>
          <CardContent className="p-6">
            {selectedUser ? (
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="h-14 w-14 rounded-full bg-[#3B4CCA] flex items-center justify-center overflow-hidden shadow-md shrink-0">
                  {selectedUser.avatar_url ? (
                    <Image src={selectedUser.avatar_url} alt="" width={56} height={56} className="object-cover" />
                  ) : (
                    <span className="font-bold text-white text-xl">
                      {(selectedUser.display_name || selectedUser.username)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">
                    {selectedUser.display_name || selectedUser.username}
                  </p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 text-xs">
                      ⭐ {selectedUser.trade_score.toFixed(1)}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 text-xs">
                      🏆 {traderLevelName(selectedUser.trader_level)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedUser.total_trades} trades
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                  <X className="h-4 w-4 mr-1" /> Change
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
                    className="pl-10 h-12 text-base"
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
                      {userQuery.length >= 2 ? "No trainers found 🔍" : "Type at least 2 characters to search"}
                    </p>
                  ) : (
                    userResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setUserQuery(""); setUserResults([]); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors text-left border border-transparent hover:border-blue-100"
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
                className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2 px-6"
              >
                Choose Cards <span className="text-lg">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 2: Card Selection with Balance Scale ═══════════ */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
              <BalanceScale offerValue={offerValue} wantValue={wantValue} />
              {/* Trade Limit Badge */}
              <div className="flex justify-center pb-3">
                {isPokemonMaster ? (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-sm px-4 py-1">
                    👑 No limit ✨
                  </Badge>
                ) : (
                  <Badge className={`text-sm px-4 py-1 ${
                    isOverTradeLimit
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>
                    {userTraderLevel.icon} Trade Limit: ${maxTradeValue}
                  </Badge>
                )}
              </div>
              {isOverTradeLimit && (
                <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium text-center">
                    ⚠️ Your trader level ({userTraderLevel.name}) limits trades to ${maxTradeValue} max. Complete more trades to increase your limit!
                  </p>
                </div>
              )}
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <div className="bg-[#E3350D] p-3 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">📥 Your Offer</h3>
                <span className="text-white/90 text-sm font-medium">${offerValue.toFixed(2)}</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <CardSlotGrid
                  items={selectedOffer}
                  onRemove={(id) => setSelectedOffer((p) => p.filter((i) => i.id !== id))}
                  emptyLabel="No cards offered yet"
                  accentColor="#E3350D"
                />
                <Button
                  variant="outline"
                  className="w-full border-dashed border-[#E3350D]/30 text-[#E3350D] hover:bg-red-50"
                  onClick={() => setBrowsingCollection("mine")}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Card from Your Collection
                </Button>
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700 font-medium whitespace-nowrap">Add Cash:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-green-600">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashOffer || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        const num = parseFloat(v) || 0;
                        setCashOffer(Math.min(num, 10000));
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-green-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-[#3B4CCA] p-3 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">📤 You Want</h3>
                <span className="text-white/90 text-sm font-medium">${wantValue.toFixed(2)}</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <CardSlotGrid
                  items={selectedWant}
                  onRemove={(id) => setSelectedWant((p) => p.filter((i) => i.id !== id))}
                  emptyLabel="No cards requested yet"
                  accentColor="#3B4CCA"
                />
                <Button
                  variant="outline"
                  className="w-full border-dashed border-[#3B4CCA]/30 text-[#3B4CCA] hover:bg-blue-50"
                  onClick={() => setBrowsingCollection("theirs")}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Card from {selectedUser?.display_name || selectedUser?.username}&apos;s Collection
                </Button>
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <DollarSign className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-700 font-medium whitespace-nowrap">Request Cash:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-blue-600">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashWant || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        const num = parseFloat(v) || 0;
                        setCashWant(Math.min(num, 10000));
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={selectedOffer.length === 0 && selectedWant.length === 0}
              className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2 px-6"
            >
              Shipping <span className="text-lg">→</span>
            </Button>
          </div>
          {browsingCollection === "mine" && (
            <CollectionBrowser
              items={myCards}
              selectedIds={offerIds}
              onToggle={toggleOffer}
              onClose={() => setBrowsingCollection(null)}
              loading={myCardsLoading}
              title="Your Collection"
            />
          )}
          {browsingCollection === "theirs" && (
            <CollectionBrowser
              items={theirCards}
              selectedIds={wantIds}
              onToggle={toggleWant}
              onClose={() => setBrowsingCollection(null)}
              loading={theirCardsLoading}
              title={`${selectedUser?.display_name || selectedUser?.username}'s Collection`}
            />
          )}
        </div>
      )}

      {/* ═══════════ STEP 3: Shipping Method + Protection ═══════════ */}
      {step === 3 && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> Shipping &amp; Protection
            </h2>
            <p className="text-white/80 text-sm">Choose shipping method and trade protection</p>
          </div>
          <CardContent className="p-6 space-y-4">
            {/* Direct Trade (Free) */}
            <button
              onClick={() => { setShippingMethod("direct"); }}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                shippingMethod === "direct"
                  ? "border-[#E3350D] bg-red-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  shippingMethod === "direct" ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Direct Trade</h3>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Free</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ship directly to each other. No Poké-Trade protection included.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">📸 Photo proof required before shipping</li>
                    <li className="flex items-center gap-2">📦 Both traders provide tracking numbers</li>
                    <li className="flex items-center gap-2">🔒 Trade locked after acceptance</li>
                    <li className="flex items-center gap-2">⏰ 7-day shipping deadline</li>
                    <li className="flex items-center gap-2">❌ No platform reimbursement or protection</li>
                  </ul>
                </div>
                {shippingMethod === "direct" && (
                  <div className="w-6 h-6 rounded-full bg-[#E3350D] flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </button>

            {/* Poké-Trade Trade Protection */}
            <button
              onClick={() => setShippingMethod("protected")}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                shippingMethod === "protected"
                  ? "border-[#FFCB05] bg-yellow-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  shippingMethod === "protected" ? "bg-[#FFCB05] text-gray-900" : "bg-gray-100 text-gray-500"
                }`}>
                  <Shield className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Poké-Trade Trade Protection</h3>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      ${fee.total.toFixed(2)}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">⭐ Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Protect eligible direct-ship trades with payment authorization, tracking verification, and platform dispute review.
                  </p>
                  {/* Dynamic fee breakdown */}
                  <div className="mt-2 p-3 bg-yellow-100/50 rounded-lg border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">Fee Breakdown</p>
                    <p className="text-xs text-yellow-700">
                      Declared value: ${totalTradeValue.toFixed(2)} · Rate: {(fee.feeRate * 100)}% · Minimum: ${fee.feeMinimum.toFixed(2)}
                    </p>
                    <p className="text-xs text-yellow-700 font-medium mt-0.5">
                      Total fee: ${fee.total.toFixed(2)} · Your share: ${fee.perParty.toFixed(2)} | Their share: ${fee.perParty.toFixed(2)}
                    </p>
                    {fee.maxBenefit > 0 && (
                      <p className="text-xs text-yellow-700 font-medium mt-0.5">
                        🛡️ Max protection benefit: up to ${fee.maxBenefit.toFixed(2)} ({membershipTier} tier)
                      </p>
                    )}
                    {fee.maxBenefit === 0 && (
                      <p className="text-xs text-orange-600 mt-0.5">
                        ⚠️ Free tier: no protection benefit. Upgrade to Pro or Elite for coverage.
                      </p>
                    )}
                    <p className="text-[10px] text-yellow-600 mt-1">
                      ${fee.feeMinimum.toFixed(2)} or {(fee.feeRate * 100)}% (whichever is higher) · Split 50/50
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">📦 Direct shipping between users</li>
                    <li className="flex items-center gap-2">📸 Required photo proof</li>
                    <li className="flex items-center gap-2">🔍 Required tracking</li>
                    <li className="flex items-center gap-2">✅ Delivery confirmation</li>
                    <li className="flex items-center gap-2">⚖️ Dispute submission portal</li>
                    <li className="flex items-center gap-2">💳 Secure payment authorization</li>
                    <li className="flex items-center gap-2">🛡️ Membership protection benefits may apply</li>
                    <li className="flex items-center gap-2 text-xs italic text-muted-foreground/70">
                      ℹ️ Poké-Trade does not receive, inspect, authenticate, or ship products
                    </li>
                  </ul>
                </div>
                {shippingMethod === "protected" && (
                  <div className="w-6 h-6 rounded-full bg-[#FFCB05] flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-gray-900" />
                  </div>
                )}
              </div>
            </button>

            {/* Legal Disclosure Checkbox (required for protection) */}
            {shippingMethod === "protected" && (
              <div className="border border-yellow-200 bg-yellow-50/50 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-sm text-yellow-800 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Trade Protection Disclosure
                </h4>
                <div className="max-h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-3 border border-gray-200">
                  {PROTECTION_DISCLAIMER}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={protectionTermsAccepted}
                    onChange={(e) => setProtectionTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#E3350D] focus:ring-[#E3350D]"
                  />
                  <span className="text-xs text-gray-700">
                    I have read and agree to the Trade Protection terms and disclosure above.
                  </span>
                </label>
              </div>
            )}

            {/* Trade Locking Notice */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mt-2">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" /> Trade Locking
              </p>
              <p className="text-xs text-red-600 mt-1">
                Once both parties accept, the trade is <strong>locked</strong>. Cards are reserved and cannot be used in other trades.
                Both parties must ship within 7 days or the trade auto-cancels.
              </p>
            </div>

            {/* Nav */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={shippingMethod === "protected" && !protectionTermsAccepted}
                className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2 px-6"
              >
                Add Message <span className="text-lg">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 4: Optional Message ═══════════ */}
      {step === 4 && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Add a Message
            </h2>
            <p className="text-white/80 text-sm">Optional — say something to your trade partner</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hey! I've been looking for this card for a while. Let me know if this trade works for you! 🎉"
              className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#E3350D]/30 focus:border-[#E3350D] transition-all"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/500 characters</p>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(5)}
                className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2 px-6"
              >
                Review Trade <span className="text-lg">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 5: Review & Submit ═══════════ */}
      {step === 5 && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
              <BalanceScale offerValue={offerValue} wantValue={wantValue} />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <div className="bg-[#E3350D] p-3">
                <h3 className="text-white font-bold text-sm">📥 Your Offer · ${offerValue.toFixed(2)}</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                {selectedOffer.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cards offered</p>
                ) : (
                  selectedOffer.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-9 rounded-md overflow-hidden bg-muted relative shrink-0 border">
                        {item.cards?.image_url && (
                          <Image src={item.cards.image_url} alt="" fill className="object-contain" sizes="36px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.cards?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.cards?.card_sets?.name}</p>
                      </div>
                      <span className="text-sm font-bold text-[#E3350D]">
                        ${(item.cards?.market_value || 0).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-[#3B4CCA] p-3">
                <h3 className="text-white font-bold text-sm">📤 You Want · ${wantValue.toFixed(2)}</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                {selectedWant.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cards requested</p>
                ) : (
                  selectedWant.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-9 rounded-md overflow-hidden bg-muted relative shrink-0 border">
                        {item.cards?.image_url && (
                          <Image src={item.cards.image_url} alt="" fill className="object-contain" sizes="36px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.cards?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.cards?.card_sets?.name}</p>
                      </div>
                      <span className="text-sm font-bold text-[#3B4CCA]">
                        ${(item.cards?.market_value || 0).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trade Details Summary */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trading with</span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedUser?.avatar_url ? (
                      <Image src={selectedUser.avatar_url} alt="" width={24} height={24} className="object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {(selectedUser?.display_name || selectedUser?.username || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {selectedUser?.display_name || selectedUser?.username}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <Badge variant="outline" className={
                  shippingMethod === "protected"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-green-50 border-green-200 text-green-700"
                }>
                  {shippingMethod === "protected" ? `🛡️ Trade Protection ($${fee.total.toFixed(2)})` : "📦 Direct Trade (Free)"}
                </Badge>
              </div>

              {shippingMethod === "protected" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your fee share</span>
                    <span className="text-sm font-medium">${fee.perParty.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Max protection benefit</span>
                    <Badge variant="outline" className={
                      fee.maxBenefit > 0
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-orange-50 border-orange-200 text-orange-700"
                    }>
                      {fee.maxBenefit > 0
                        ? `🛡️ Up to $${fee.maxBenefit.toFixed(2)} (${membershipTier})`
                        : "⚠️ None (free tier)"}
                    </Badge>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trade Locking</span>
                <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                  🔒 Locked until both ship
                </Badge>
              </div>

              {notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Message</span>
                  <p className="text-sm mt-1 bg-muted/50 rounded-lg p-3 italic">&ldquo;{notes}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (selectedOffer.length === 0 && selectedWant.length === 0) || isOverTradeLimit}
              className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>🎴 {counterId ? "Send Counter Offer" : "Propose Trade!"}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewTradePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-5xl mx-auto">
          <div>

            <h1 className="text-2xl font-bold">🎮 Pokétopia Trade Center</h1>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <NewTradeContent />
    </Suspense>
  );
}
