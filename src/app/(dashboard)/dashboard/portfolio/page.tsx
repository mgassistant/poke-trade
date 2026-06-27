"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, TrendingUp, TrendingDown, Wallet, Clock, Award, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TopCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  image_url: string | null;
  set_name: string;
  value: number;
  quantity: number;
  created_at?: string;
}

interface SetBreakdown {
  id: string;
  name: string;
  value: number;
  count: number;
}

interface RarityBreakdown {
  rarity: string;
  value: number;
  count: number;
}

interface PortfolioStats {
  totalValue: number;
  totalCards: number;
  gradedCards: number;
  forTradeCards: number;
  valueBySet: SetBreakdown[];
  valueByRarity: RarityBreakdown[];
  topCards: TopCard[];
  recentCards: TopCard[];
  change7d: number | null;
}

type TimeRange = "7D" | "1M" | "3M" | "6M" | "MAX";

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");

  useEffect(() => {
    fetch("/api/portfolio/stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxSetValue = data?.valueBySet?.[0]?.value || 1;
  const totalRarityValue = data?.valueByRarity?.reduce((s, r) => s + r.value, 0) || 1;

  // Rarity colors
  const rarityColors: Record<string, string> = {
    "Common": "#94a3b8",
    "Uncommon": "#22c55e",
    "Rare": "#3b82f6",
    "Rare Holo": "#6366f1",
    "Ultra Rare": "#a855f7",
    "Secret Rare": "#f59e0b",
    "Illustration Rare": "#ec4899",
    "Special Illustration Rare": "#f43f5e",
    "Hyper Rare": "#ef4444",
    "Unknown": "#d1d5db",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-gray-500 text-sm mt-1">Your collection value & analytics</p>
      </div>

      {/* Portfolio Value Hero */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Total Portfolio Value</p>
            {loading ? (
              <Skeleton className="h-12 w-48 mx-auto mb-2" />
            ) : (
              <div className="text-4xl sm:text-5xl font-bold text-gray-900">
                ${(data?.totalValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            {!loading && data?.change7d != null && (
              <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-medium ${
                data.change7d >= 0 ? "text-green-600" : "text-red-500"
              }`}>
                {data.change7d >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {data.change7d >= 0 ? "+" : ""}${Math.abs(data.change7d).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in the last 7 days
              </div>
            )}
            {!loading && data?.change7d == null && (
              <p className="text-xs text-gray-400 mt-2">Historical tracking starts today</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Range + Chart Area */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Value Over Time</h3>
            <div className="flex gap-1">
              {(["7D", "1M", "3M", "6M", "MAX"] as TimeRange[]).map((range) => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    timeRange === range ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          {/* Simple SVG chart placeholder - single point for MVP */}
          <div className="h-40 flex items-center justify-center relative bg-gradient-to-b from-blue-50 to-white rounded-lg">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <div className="text-center">
                <svg viewBox="0 0 300 100" className="w-full h-32">
                  {/* Grid lines */}
                  <line x1="30" y1="20" x2="280" y2="20" stroke="#e5e7eb" strokeWidth="0.5" />
                  <line x1="30" y1="50" x2="280" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
                  <line x1="30" y1="80" x2="280" y2="80" stroke="#e5e7eb" strokeWidth="0.5" />
                  {/* Current value line */}
                  <line x1="30" y1="50" x2="280" y2="50" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
                  {/* Current value dot */}
                  <circle cx="280" cy="50" r="4" fill="#3b82f6" />
                  <circle cx="280" cy="50" r="7" fill="#3b82f6" fillOpacity="0.2" />
                  {/* Value label */}
                  <text x="265" y="43" fontSize="8" fill="#3b82f6" fontWeight="600" textAnchor="end">
                    ${(data?.totalValue || 0).toFixed(0)}
                  </text>
                </svg>
                <p className="text-[11px] text-gray-400 -mt-2">Portfolio tracking — data will appear as values are recorded</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      {!loading && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Wallet, label: "Total Cards", value: data.totalCards.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Award, label: "Graded", value: data.gradedCards.toLocaleString(), color: "text-purple-600", bg: "bg-purple-50" },
            { icon: ArrowRightLeft, label: "For Trade", value: data.forTradeCards.toLocaleString(), color: "text-orange-600", bg: "bg-orange-50" },
            { icon: TrendingUp, label: "Avg Value", value: data.totalCards ? `$${(data.totalValue / data.totalCards).toFixed(2)}` : "$0.00", color: "text-green-600", bg: "bg-green-50" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-3 pb-2.5 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[11px] text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card><CardContent className="pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-9 rounded" />
                <div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ))}
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full mb-2" />)}
          </CardContent></Card>
        </div>
      ) : !data || (data.topCards.length === 0 && data.valueBySet.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-gray-200 mb-4" />
            <h3 className="font-semibold mb-1">No portfolio data yet</h3>
            <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
              Add cards to your collection to see portfolio analytics.
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/collection">Go to Collection</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Most Valuable Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  Most Valuable Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {data.topCards.map((card, i) => (
                    <div key={card.id + "-" + i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      {card.image_url ? (
                        <div className="h-12 w-9 relative rounded overflow-hidden bg-gray-100 shrink-0">
                          <Image src={card.image_url} alt={card.name} fill className="object-contain" sizes="36px" />
                        </div>
                      ) : (
                        <div className="h-12 w-9 bg-gray-100 rounded shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {card.set_name} · #{card.number}
                          {card.rarity && ` · ${card.rarity}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">${card.value.toFixed(2)}</p>
                        {card.quantity > 1 && (
                          <p className="text-[10px] text-gray-400">×{card.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recently Added */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Recently Added
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {data.recentCards.map((card, i) => (
                    <div key={card.id + "-recent-" + i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      {card.image_url ? (
                        <div className="h-12 w-9 relative rounded overflow-hidden bg-gray-100 shrink-0">
                          <Image src={card.image_url} alt={card.name} fill className="object-contain" sizes="36px" />
                        </div>
                      ) : (
                        <div className="h-12 w-9 bg-gray-100 rounded shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {card.set_name} · #{card.number}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">${card.value.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Value by Set */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  Value by Set
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.valueBySet.map((set) => (
                    <div key={set.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate flex-1 mr-2">{set.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">{set.count}</Badge>
                          <span className="text-sm font-medium w-20 text-right">${set.value.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(set.value / maxSetValue) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Value by Rarity — Donut Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  Value by Rarity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  {/* CSS Donut */}
                  <div className="relative w-40 h-40 mb-4">
                    <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                      {(() => {
                        let offset = 0;
                        const circumference = 2 * Math.PI * 60;
                        return data.valueByRarity.map((r) => {
                          const pct = r.value / totalRarityValue;
                          const dashLength = pct * circumference;
                          const dashOffset = -offset * circumference;
                          offset += pct;
                          const color = rarityColors[r.rarity] || "#94a3b8";
                          return (
                            <circle key={r.rarity} cx="80" cy="80" r="60" fill="none"
                              stroke={color} strokeWidth="20"
                              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                              strokeDashoffset={dashOffset} />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold">{data.valueByRarity.length}</span>
                      <span className="text-[10px] text-gray-500">Rarities</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="w-full space-y-1.5">
                    {data.valueByRarity.map((r) => {
                      const color = rarityColors[r.rarity] || "#94a3b8";
                      const pct = ((r.value / totalRarityValue) * 100).toFixed(1);
                      return (
                        <div key={r.rarity} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate">{r.rarity}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-gray-500 text-xs">{pct}%</span>
                            <span className="font-medium w-16 text-right">${r.value.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
