"use client";

import { Shield } from "lucide-react";

interface VerificationBadgeProps {
  level: number;
  className?: string;
  showTooltip?: boolean;
}

const LEVEL_CONFIG: Record<
  number,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  0: {
    label: "Unverified",
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
  },
  1: {
    label: "Email Verified",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  2: {
    label: "Phone Verified",
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  3: {
    label: "ID Verified",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  4: {
    label: "Fully Verified",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

export function VerificationBadge({
  level,
  className = "",
  showTooltip = true,
}: VerificationBadgeProps) {
  const config = LEVEL_CONFIG[Math.min(level, 4)] ?? LEVEL_CONFIG[0];

  if (level === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.borderColor} ${config.color} ${className}`}
      title={showTooltip ? config.label : undefined}
    >
      <Shield className="h-3 w-3" />
      <span className="sr-only">{config.label}</span>
      {level}
    </span>
  );
}
