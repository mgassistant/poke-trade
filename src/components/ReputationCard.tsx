"use client";

import { Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type ReputationProfile,
  type ReputationCategories,
  getCategoryLabel,
  getRatingLabel,
  getRatingColor,
} from "@/lib/reputation";

interface ReputationCardProps {
  reputation: ReputationProfile;
  trustScore?: number;
  compact?: boolean;
  className?: string;
}

export function ReputationCard({
  reputation,
  trustScore,
  compact = false,
  className = "",
}: ReputationCardProps) {
  if (reputation.totalReviews === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Star className="h-8 w-8 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {renderStars(reputation.overall)}
        <span className="text-sm font-semibold">{reputation.overall.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({reputation.totalReviews})</span>
      </div>
    );
  }

  const categories: (keyof ReputationCategories)[] = [
    "communication",
    "accuracy",
    "shipping",
    "condition",
    "overall",
  ];

  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-3">
        {/* Overall Rating */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {renderStars(reputation.overall)}
              <span className="text-lg font-bold">{reputation.overall.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{reputation.totalReviews} reviews</span>
              <span>•</span>
              <span>{reputation.tradeReviews} trades</span>
              <span>•</span>
              <span>{reputation.saleReviews} sales</span>
            </div>
          </div>
          {trustScore !== undefined && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Trust Score
              </div>
              <span className="text-lg font-bold">{trustScore}</span>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          {categories.map((category) => {
            const value = reputation.categories[category];
            if (value === 0) return null;
            return (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 shrink-0">
                  {getCategoryLabel(category)}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      value >= 4.5
                        ? "bg-green-500"
                        : value >= 3.5
                        ? "bg-blue-500"
                        : value >= 2.5
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${(value / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-8 text-right ${getRatingColor(value)}`}>
                  {value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rating Label */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {getRatingLabel(reputation.overall)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
