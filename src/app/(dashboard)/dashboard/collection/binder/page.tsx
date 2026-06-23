"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Share2, BookOpen, BarChart3,
  Loader2, Star, Package, ArrowUpDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BinderCard {
  id: string;
  card_id: string;
  quantity: number;
  condition: string;
  created_at: string;
  cards: {
    id: string;
    name: string;
    number: string;
    rarity: string;
    image_url: string | null;
    market_value: number | null;
    card_sets: { id: string; name: string; symbol_url?: string | null } | null;
  };
}

interface BinderStats {
  totalCards: number;
  totalValue: number;
  rarestCard: { name: string; rarity: string; image_url: string | null; market_value: number | null } | null;
  setCompletion: { name: string; owned: number }[];
}

interface OwnerInfo {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const SORT_OPTIONS = [
  { value: "date_added", label: "Date Added" },
  { value: "value", label: "Value" },
  { value: "rarity", label: "Rarity" },
  { value: "set_order", label: "Set Order" },
];

export default function BinderPage() {
  const [items, setItems] = useState<BinderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [stats, setStats] = useState<BinderStats | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [sort, setSort] = useState("date_added");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/binder?page=${page}&sort=${sort}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCards(data.totalCards || 0);
      setStats(data.stats || null);
      setOwner(data.owner || null);
    } catch {} finally {
      setLoading(false);
    }
  }, [page, sort]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const goToPage = (newPage: number, direction: "left" | "right") => {
    if (newPage < 1 || newPage > totalPages) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setPage(newPage);
      setTimeout(() => setIsFlipping(false), 300);
    }, 200);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/binder/share", { method: "POST" });
      const data = await res.json();
      if (data.share_code) {
        setShareCode(data.share_code);
        const url = `${window.location.origin}/dashboard/collection/binder?share=${data.share_code}`;
        await navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch {} finally {
      setSharing(false);
    }
  };

  // Fill empty slots for the 3x3 grid
  const slots: (BinderCard | null)[] = [...items];
  while (slots.length < 9) slots.push(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📔 My Binder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCards} cards in your collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            {SORT_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} className="gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Stats
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing} className="gap-1">
            {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
            Share
          </Button>
        </div>
      </div>

      {shareCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          ✅ Binder link copied to clipboard! Share code: <code className="font-mono bg-green-100 px-1.5 py-0.5 rounded">{shareCode}</code>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Binder */}
        <div className="flex-1">
          <div className="relative">
            {/* Binder background */}
            <div className="bg-gray-900 rounded-xl shadow-2xl p-4 sm:p-6 relative overflow-hidden">
              {/* Binder rings */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gray-800 flex flex-col justify-around items-center py-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-4 h-8 rounded-full border-2 border-gray-600 bg-gray-700" />
                ))}
              </div>

              {/* Page */}
              <div
                className={`ml-4 transition-all duration-300 ${
                  isFlipping
                    ? flipDirection === "right"
                      ? "transform -rotate-y-2 opacity-50 scale-95"
                      : "transform rotate-y-2 opacity-50 scale-95"
                    : ""
                }`}
                style={{ perspective: "1000px" }}
              >
                {loading ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="aspect-[2.5/3.5] rounded-lg bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {slots.map((item, idx) => (
                      <div
                        key={item?.id || `empty-${idx}`}
                        className={`aspect-[2.5/3.5] rounded-lg relative overflow-hidden transition-transform hover:scale-105 ${
                          item
                            ? "bg-gray-800 border border-gray-700 shadow-inner"
                            : "bg-gray-800/50 border border-gray-700/30"
                        }`}
                      >
                        {item ? (
                          <>
                            {/* Card sleeve shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10 rounded-lg" />
                            {/* Card */}
                            <div className="absolute inset-1 rounded overflow-hidden">
                              {item.cards?.image_url ? (
                                <Image
                                  src={item.cards.image_url}
                                  alt={item.cards.name}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 640px) 30vw, 200px"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-800">
                                  <Package className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            {/* Value tooltip on hover */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform opacity-0 hover:opacity-100">
                              <p className="text-[9px] text-white truncate">{item.cards?.name}</p>
                              {item.cards?.market_value && (
                                <p className="text-[9px] text-green-400">${Number(item.cards.market_value).toFixed(2)}</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="w-8 h-10 rounded border-2 border-dashed border-gray-700/50" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Page indicator */}
              <div className="flex items-center justify-center gap-4 mt-4 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(page - 1, "left")}
                  disabled={page <= 1 || loading}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="text-gray-400 text-sm font-mono">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(page + 1, "right")}
                  disabled={page >= totalPages || loading}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        {showStats && stats && (
          <div className="lg:w-72 space-y-4">
            {/* Total Stats */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Binder Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cards</span>
                    <span className="font-bold">{stats.totalCards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-bold text-green-600">${stats.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rarest Card */}
            {stats.rarestCard && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" /> Rarest Card
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-12 rounded overflow-hidden bg-muted relative shrink-0">
                      {stats.rarestCard.image_url && (
                        <Image src={stats.rarestCard.image_url} alt="" fill className="object-contain" sizes="48px" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{stats.rarestCard.name}</p>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{stats.rarestCard.rarity}</Badge>
                      {stats.rarestCard.market_value && (
                        <p className="text-xs text-green-600 mt-0.5">${Number(stats.rarestCard.market_value).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Set Completion */}
            {stats.setCompletion.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4" /> Set Progress
                  </h3>
                  <div className="space-y-2.5">
                    {stats.setCompletion.map(set => (
                      <div key={set.name}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground truncate flex-1 mr-2">{set.name}</span>
                          <span className="font-medium shrink-0">{set.owned} cards</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#E3350D] rounded-full transition-all"
                            style={{ width: `${Math.min(100, (set.owned / 200) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
