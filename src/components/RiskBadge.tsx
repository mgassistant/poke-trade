"use client";

import { Shield } from "lucide-react";
import { getRiskBadgeColors, type RiskLevel } from "@/lib/fraud-detection";

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  flags?: string[];
  compact?: boolean;
  className?: string;
}

export function RiskBadge({ level, score, flags = [], compact = false, className = "" }: RiskBadgeProps) {
  const colors = getRiskBadgeColors(level);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} ${className}`}
        title={`Risk Score: ${score}/100 (${level})\n${flags.join("\n")}`}
      >
        <Shield className="h-3 w-3" />
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className={`h-4 w-4 ${colors.text}`} />
          <span className={`text-sm font-bold ${colors.text}`}>
            Risk: {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        </div>
        <span className={`text-xs font-semibold ${colors.text}`}>{score}/100</span>
      </div>

      {/* Risk bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all ${
            level === "high"
              ? "bg-red-500"
              : level === "medium"
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="space-y-1 mt-2">
          {flags.map((flag, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span>{colors.icon}</span>
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
