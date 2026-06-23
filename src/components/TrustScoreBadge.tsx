"use client";

import { Shield, ShieldCheck, Star, Crown, Sparkles } from "lucide-react";
import {
  getTrustScoreTier,
  getTrustScoreColor,
  getTrustScoreBgColor,
  type TrustScoreTier,
} from "@/lib/trust-score";

interface TrustScoreBadgeProps {
  score: number;
  verificationLevel?: number;
  compact?: boolean;
  className?: string;
}

function getTierIcon(tier: TrustScoreTier) {
  switch (tier) {
    case "Master":
      return <Sparkles className="h-3.5 w-3.5" />;
    case "Elite":
      return <Crown className="h-3.5 w-3.5" />;
    case "Veteran":
      return <Star className="h-3.5 w-3.5" />;
    case "Trusted":
      return <ShieldCheck className="h-3.5 w-3.5" />;
    default:
      return <Shield className="h-3.5 w-3.5" />;
  }
}

function getVerificationIcons(level: number) {
  const icons: React.ReactNode[] = [];
  if (level >= 1) icons.push(<span key="email" title="Email Verified">📧</span>);
  if (level >= 2) icons.push(<span key="phone" title="Phone Verified">📱</span>);
  if (level >= 3) icons.push(<span key="id" title="ID Verified">🪪</span>);
  if (level >= 4) icons.push(<span key="address" title="Address Verified">🏠</span>);
  return icons;
}

export function TrustScoreBadge({
  score,
  verificationLevel = 0,
  compact = false,
  className = "",
}: TrustScoreBadgeProps) {
  const tier = getTrustScoreTier(score);
  const color = getTrustScoreColor(score);
  const bgColor = getTrustScoreBgColor(score);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${bgColor} ${color} ${className}`}
        title={`Trust Score: ${score} (${tier})`}
      >
        {getTierIcon(tier)}
        {score}
      </span>
    );
  }

  const progressPercent = Math.min(((score - 100) / 900) * 100, 100);

  return (
    <div className={`rounded-lg border p-3 ${bgColor} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={color}>{getTierIcon(tier)}</span>
          <span className={`text-sm font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 1000</span>
        </div>
        <span className={`text-xs font-semibold ${color}`}>{tier}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all ${
            score >= 900
              ? "bg-purple-500"
              : score >= 700
              ? "bg-amber-500"
              : score >= 500
              ? "bg-green-500"
              : score >= 300
              ? "bg-blue-500"
              : "bg-gray-400"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Verification icons */}
      {verificationLevel > 0 && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Verified:</span>
          {getVerificationIcons(verificationLevel)}
        </div>
      )}
    </div>
  );
}
