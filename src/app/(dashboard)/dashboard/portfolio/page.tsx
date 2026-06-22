"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, TrendingUp, Wallet } from "lucide-react";
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

interface PortfolioData {
  totalValue: number;
  topCards: TopCard[];
  bySet: SetBreakdown[];
  byRarity: RarityBreakdown[];
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxSetValue = data?.bySet?.[0]?.value || 1;
  const maxRarityValue = data?.byRarity?.[0]?.value || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">Your collection value at a glance</p>
      </div>

      {/* Total Value */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
            {loading ? (
              <Skeleton className="h-10 w-40 mx-auto" />
            ) : (
              <div className="text-4xl font-bold text-primary">
                ${(data?.totalValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-32 mb-4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-12 w-9 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-32 mb-4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : !data || (data.topCards.length === 0 && data.bySet.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No portfolio data yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              Add cards to your collection to see portfolio analytics.
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/collection">Go to Collection</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top 10 Most Valuable Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                Top 10 Most Valuable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topCards.map((card, i) => (
                  <div key={card.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                      #{i + 1}
                    </span>
                    {card.image_url ? (
                      <div className="h-12 w-9 relative rounded overflow-hidden bg-muted shrink-0">
                        <Image src={card.image_url} alt={card.name} fill className="object-contain" sizes="36px" />
                      </div>
                    ) : (
                      <div className="h-12 w-9 bg-muted rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {card.set_name} · #{card.number}
                        {card.rarity && ` · ${card.rarity}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">${card.value.toFixed(2)}</p>
                      {card.quantity > 1 && (
                        <p className="text-[10px] text-muted-foreground">×{card.quantity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* By Set */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-400" />
                  Value by Set
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.bySet.slice(0, 10).map((set) => (
                    <div key={set.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate flex-1 mr-2">{set.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">{set.count} cards</Badge>
                          <span className="text-sm font-medium w-20 text-right">${set.value.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${(set.value / maxSetValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Rarity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  Value by Rarity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.byRarity.map((r) => (
                    <div key={r.rarity}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{r.rarity}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">{r.count} cards</Badge>
                          <span className="text-sm font-medium w-20 text-right">${r.value.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div
                          className="h-full bg-purple-400 rounded-full transition-all"
                          style={{ width: `${(r.value / maxRarityValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
