"use client";

import Link from "next/link";
import { Shield, CheckCircle, XCircle, ArrowRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getProtectionTier,
  isEligibleForProtection,
  PROTECTION_DISCLAIMER_SHORT,
  type MembershipTier,
} from "@/lib/protection-program";

interface ProtectionBannerProps {
  membershipTier?: MembershipTier;
  trade?: {
    documentation_complete?: boolean;
    tracking_number?: string | null;
    shipping_tracked?: boolean;
  } | null;
  user?: {
    verification_level?: number;
    trust_score?: number;
  } | null;
  compact?: boolean;
}

export default function ProtectionBanner({
  membershipTier = "free",
  trade = null,
  user = null,
  compact = false,
}: ProtectionBannerProps) {
  const tier = getProtectionTier(membershipTier);
  const eligibility = isEligibleForProtection(trade, user);

  if (compact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
        <Shield className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-blue-800">
            {tier.name} — {PROTECTION_DISCLAIMER_SHORT}
          </p>
        </div>
        <Link
          href="/dashboard/protection"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
        >
          Details
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-sm text-blue-900">{tier.name}</h3>
          <Badge
            variant="outline"
            className={
              membershipTier === "elite"
                ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                : membershipTier === "pro"
                ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                : "bg-gray-50 text-gray-600 border-gray-200 text-[10px]"
            }
          >
            {membershipTier.charAt(0).toUpperCase() + membershipTier.slice(1)} Tier
          </Badge>
        </div>
        <Link href="/dashboard/protection">
          <span className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View Details <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      {/* Eligibility */}
      {trade && user && (
        <div className="flex flex-wrap gap-2">
          {eligibility.requirements.map((req) => (
            <div
              key={req.key}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
                req.met
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {req.met ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {req.label}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-600/80">{PROTECTION_DISCLAIMER_SHORT}</p>
      </div>
    </div>
  );
}
