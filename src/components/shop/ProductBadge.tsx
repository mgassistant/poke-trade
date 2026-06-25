"use client";

import { Badge } from "@/components/ui/badge";
import { Crown, Clock, Star, Lock, Zap, Package } from "lucide-react";

type BadgeType =
  | "member_exclusive"
  | "limited_drop"
  | "personal_collection"
  | "early_access"
  | "sold_out"
  | "premium_only"
  | "verified";

interface ProductBadgeProps {
  type: BadgeType;
  className?: string;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  member_exclusive: {
    label: "Member Exclusive",
    icon: Lock,
    classes: "bg-purple-100 text-purple-700 border-purple-200",
  },
  limited_drop: {
    label: "Limited Drop",
    icon: Zap,
    classes: "bg-red-100 text-red-700 border-red-200",
  },
  personal_collection: {
    label: "Personal Collection",
    icon: Star,
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  early_access: {
    label: "Early Access",
    icon: Clock,
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  sold_out: {
    label: "Sold Out",
    icon: Package,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  },
  premium_only: {
    label: "Premium Only",
    icon: Crown,
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  verified: {
    label: "Verified",
    icon: Star,
    classes: "bg-green-100 text-green-700 border-green-200",
  },
};

export function ProductBadge({ type, className = "" }: ProductBadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-medium ${config.classes} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
