"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Star, Shield, ShieldCheck, Crown,
  MapPin, Calendar, Package, Share2, Repeat, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CONDITION_BY_VALUE, getConditionInfo } from "@/lib/constants/conditions";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { VerificationBadge } from "@/components/VerificationBadge";

interface SellerProfileClientProps {
  username: string;
}

interface SellerData {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    trade_score: number;
    trader_level: number;
    total_trades: number;
    total_sales: number;
    is_verified: boolean;
    is_premium: boolean;
    subscription_tier: string;
    created_at: string;
    trust_score: number;
    verification_level: number;
  };
  listings: any[];
  reviews: any[];
  stats: {
    total_listings: number;
    total_trades: number;
    total_sales: number;
    member_since: string;
  };
}

export function SellerProfileClient({ username }: SellerProfileClientProps) {
  const [data, setData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/seller/${encodeURIComponent(username)}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Seller Not Found</h1>
          <p className="text-muted-foreground mb-4">This seller profile doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { profile, listings, reviews, stats } = data;
  const memberSince = new Date(stats.member_since).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const tierBadge = {
    elite: { label: "Elite Seller", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Crown },
    pro: { label: "Pro Seller", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ShieldCheck },
    free: { label: "Seller", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Shield },
  }[profile.subscription_tier] || { label: "Seller", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Shield };

  const TierIcon = tierBadge.icon;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="h-24 w-24 rounded-full bg-muted overflow-hidden border-4 border-background shadow-lg">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.username} width={96} height={96} className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
              <Badge className={`${tierBadge.color} gap-1`}>
                <TierIcon className="h-3 w-3" />
                {tierBadge.label}
              </Badge>
              {profile.is_verified && (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
              <VerificationBadge level={profile.verification_level ?? 0} />
              <TrustScoreBadge score={profile.trust_score ?? 100} compact />
            </div>
            <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Member since {memberSince}
              </span>
              {profile.trade_score > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  {Number(profile.trade_score).toFixed(1)} rating
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button asChild>
                <Link href={`/dashboard/trades/new?partner=${profile.username}`}>
                  <Repeat className="h-4 w-4 mr-1" />
                  Propose Trade
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Cards for Sale", value: stats.total_listings, icon: Package },
            { label: "Trades Completed", value: stats.total_trades, icon: Repeat },
            { label: "Items Sold", value: stats.total_sales, icon: Package },
            { label: "Trade Score", value: Number(profile.trade_score).toFixed(1), icon: Star },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Cards for Sale ({listings.length})</h2>
          {listings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">No active listings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing: any) => {
                const condInfo = getConditionInfo(listing.condition);
                return (
                  <Link key={listing.id} href={listing.card?.id ? `/card/${listing.card.id}` : "#"}>
                    <Card className="overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
                      <CardContent className="p-0">
                        <div className="aspect-[2.5/3.5] relative bg-muted">
                          {listing.photos?.length > 0 ? (
                            <Image
                              src={listing.photos[0]}
                              alt={listing.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          ) : listing.card?.image_url ? (
                            <Image
                              src={listing.card.image_url}
                              alt={listing.title}
                              fill
                              className="object-contain p-2"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge className={`text-[10px] ${condInfo.bgColor} ${condInfo.color} ${condInfo.borderColor}`}>
                              {condInfo.shortLabel}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm truncate">{listing.title}</h3>
                          <p className="text-lg font-bold text-green-600 mt-1">${Number(listing.price).toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (review.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm">{review.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
