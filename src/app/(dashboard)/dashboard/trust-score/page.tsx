"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Star, TrendingUp, Award, CheckCircle, AlertTriangle,
  Clock, UserCheck, Package, MessageSquare, Truck, Ban
} from "lucide-react";
import { TRADER_LEVELS, getTraderLevel } from "@/lib/constants";

/* ── Types ── */
interface TrustScoreData {
  user_id: string;
  username: string;
  score: number;
  tier: string;
  color: string;
  factors: {
    accountAge: number;
    verificationLevel: number;
    completedTrades: number;
    completedSales: number;
    averageRating: number;
    successfulDeliveries: number;
    deductions: number;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const TRUST_TIERS = [
  { name: "Rookie", minScore: 100, maxScore: 299, icon: "🌱", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", benefits: "Basic trading access" },
  { name: "Trusted", minScore: 300, maxScore: 499, icon: "🤝", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", benefits: "Increased visibility, trust badge" },
  { name: "Veteran", minScore: 500, maxScore: 699, icon: "⭐", color: "text-green-600", bg: "bg-green-50 border-green-200", benefits: "Priority matching, veteran badge" },
  { name: "Elite", minScore: 700, maxScore: 899, icon: "💎", color: "text-amber-500", bg: "bg-amber-50 border-amber-200", benefits: "Featured profile, elite badge, priority support" },
  { name: "Master", minScore: 900, maxScore: 1000, icon: "👑", color: "text-purple-600", bg: "bg-purple-50 border-purple-200", benefits: "Top placement, master badge, exclusive perks" },
];

const SCORE_FACTORS = [
  { key: "accountAge", label: "Account Age", max: 100, icon: Clock, color: "bg-blue-500" },
  { key: "verificationLevel", label: "Verification Level", max: 200, icon: UserCheck, color: "bg-green-500" },
  { key: "completedTrades", label: "Completed Trades", max: 150, icon: Package, color: "bg-purple-500" },
  { key: "completedSales", label: "Completed Sales", max: 100, icon: TrendingUp, color: "bg-indigo-500" },
  { key: "averageRating", label: "Average Rating", max: 150, icon: Star, color: "bg-yellow-500" },
  { key: "successfulDeliveries", label: "Successful Deliveries", max: 100, icon: Truck, color: "bg-teal-500" },
] as const;

const IMPROVEMENT_TIPS = [
  { icon: Package, tip: "Complete trades to level up your trader rank" },
  { icon: UserCheck, tip: "Verify your identity (email, phone, ID) for up to 200 pts" },
  { icon: Star, tip: "Get positive reviews from trade partners" },
  { icon: Truck, tip: "Maintain successful deliveries with tracking numbers" },
  { icon: Ban, tip: "Avoid disputes and community reports" },
];

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function TrustScorePage() {
  const [data, setData] = useState<TrustScoreData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTrades, setTotalTrades] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [scoreRes, reviewsRes, settingsRes] = await Promise.all([
          fetch("/api/trust-score"),
          fetch("/api/reviews?tab=received"),
          fetch("/api/settings"),
        ]);
        const scoreData = await scoreRes.json();
        const reviewsData = await reviewsRes.json();
        const settingsData = await settingsRes.json();

        if (scoreData.score !== undefined) setData(scoreData);
        if (reviewsData.reviews) setReviews(reviewsData.reviews.slice(0, 5));
        if (settingsData.profile?.total_trades) setTotalTrades(settingsData.profile.total_trades);
      } catch (e) {
        console.error("Failed to load trust score data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#E3350D]" /> Trust Score
        </h1>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-64 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#E3350D]" /> Trust Score
        </h1>
        <p className="text-muted-foreground mt-4">Unable to load trust score data.</p>
      </div>
    );
  }

  const currentTier = TRUST_TIERS.find((t) => data.score >= t.minScore && data.score <= t.maxScore) || TRUST_TIERS[0];
  const traderLevel = getTraderLevel(totalTrades);
  const nextLevel = TRADER_LEVELS.find((l) => l.minTrades > totalTrades);
  const progressToNext = nextLevel
    ? ((totalTrades - traderLevel.minTrades) / (nextLevel.minTrades - traderLevel.minTrades)) * 100
    : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#E3350D]" /> Trust Score Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your reputation and trading credibility at a glance
        </p>
      </div>

      {/* 1. Your Trust Score */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#E3350D] to-[#c72e0b] p-6 text-center text-white">
          <p className="text-sm font-medium opacity-80 mb-2">Your Trust Score</p>
          <div className="text-6xl font-black mb-2">{data.score}</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">{currentTier.icon}</span>
            <span className="text-2xl font-bold">{currentTier.name}</span>
          </div>
          <p className="text-sm opacity-70 mt-2">Score range: 100 – 1,000</p>
        </div>
      </Card>

      {/* 2. Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-[#3B4CCA]" /> Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SCORE_FACTORS.map((factor) => {
            const value = data.factors[factor.key as keyof typeof data.factors] as number;
            const Icon = factor.icon;
            return (
              <div key={factor.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {factor.label}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {value} / {factor.max} pts
                  </span>
                </div>
                <ScoreBar value={value} max={factor.max} color={factor.color} />
              </div>
            );
          })}

          {/* Deductions */}
          {data.factors.deductions > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Deductions
                </div>
                <span className="text-sm text-red-600 font-medium">
                  -{data.factors.deductions} pts
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-700"
                  style={{ width: `${Math.min((data.factors.deductions / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {data.factors.deductions === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              No deductions — clean record! 🎉
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Trader Level + 4. Trade Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-[#FFCB05]" /> Your Trader Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{traderLevel.icon}</span>
              <div>
                <p className="text-xl font-bold">{traderLevel.name}</p>
                <p className="text-sm text-muted-foreground">Level {traderLevel.level}</p>
              </div>
            </div>
            {nextLevel ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{totalTrades} trades</span>
                  <span>{nextLevel.minTrades} trades needed</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FFCB05] transition-all duration-700"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextLevel.minTrades - totalTrades} more trade{nextLevel.minTrades - totalTrades !== 1 ? "s" : ""} to reach {nextLevel.icon} {nextLevel.name}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                Maximum level reached! 👑
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-[#E3350D]" /> Trade Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {traderLevel.maxTradeValue === Infinity ? (
                <>
                  <p className="text-4xl font-black text-purple-600">∞</p>
                  <p className="text-lg font-bold text-purple-600 mt-1">No Limit ✨</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    As a {traderLevel.name}, you have unlimited trade value!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-[#E3350D]">${traderLevel.maxTradeValue}</p>
                  <p className="text-lg font-bold mt-1">Max Trade Value</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on your {traderLevel.name} level. Level up to increase!
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. All Trust Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏆 All Trust Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TRUST_TIERS.map((tier) => {
              const isCurrentTier = currentTier.name === tier.name;
              return (
                <div
                  key={tier.name}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${tier.bg} ${
                    isCurrentTier ? "ring-2 ring-[#E3350D] ring-offset-2 shadow-md" : ""
                  }`}
                >
                  <span className="text-3xl block mb-2">{tier.icon}</span>
                  <p className={`font-bold ${tier.color}`}>{tier.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tier.minScore} – {tier.maxScore}
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">{tier.benefits}</p>
                  {isCurrentTier && (
                    <Badge className="mt-2 bg-[#E3350D] text-white text-[10px]">You</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 6. All Trader Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚡ All Trader Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRADER_LEVELS.map((level) => {
              const isCurrent = traderLevel.level === level.level;
              return (
                <div
                  key={level.level}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? "border-[#FFCB05] bg-yellow-50 ring-2 ring-[#FFCB05] ring-offset-1 shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{level.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{level.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {level.minTrades}+ trades
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Trade Limit:</span>
                    <Badge variant="outline" className="text-xs">
                      {level.maxTradeValue === Infinity ? "No limit ✨" : `$${level.maxTradeValue}`}
                    </Badge>
                  </div>
                  {isCurrent && (
                    <Badge className="mt-2 bg-[#FFCB05] text-gray-900 text-[10px]">Current</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 7. How to Improve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" /> How to Improve Your Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {IMPROVEMENT_TIPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm">{item.tip}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 8. Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#3B4CCA]" /> Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete trades and get rated by your partners!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-[#3B4CCA] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(review.reviewer?.display_name || review.reviewer?.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {review.reviewer?.display_name || review.reviewer?.username || "Anonymous"}
                      </p>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
