"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, ArrowRight,
  Crown, Clock, FileText, Loader2, Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/lib/hooks/useUser";
import {
  getProtectionTier,
  getAllProtectionTiers,
  isEligibleForProtection,
  PROTECTION_DISCLAIMER,
  type MembershipTier,
  type ProtectionTier,
} from "@/lib/protection-program";

interface PastClaim {
  id: string;
  reason: string;
  status: string;
  outcome: string | null;
  credit_amount: number;
  created_at: string;
  decided_at: string | null;
}

export default function ProtectionPage() {
  const { profile, loading: userLoading } = useUser();
  const [claims, setClaims] = useState<PastClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  const membershipTier: MembershipTier =
    (profile?.membership_tier as MembershipTier) ?? "free";
  const currentTier = getProtectionTier(membershipTier);
  const allTiers = getAllProtectionTiers();

  const eligibility = isEligibleForProtection(null, {
    verification_level: profile?.verification_level ?? 0,
    trust_score: profile?.trust_score ?? 100,
  });

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await fetch("/api/disputes");
        const data = await res.json();
        if (data.disputes) {
          setClaims(
            data.disputes.map((d: Record<string, unknown>) => ({
              id: d.id,
              reason: d.reason,
              status: d.status,
              outcome: d.outcome ?? null,
              credit_amount: d.credit_amount ?? 0,
              created_at: d.created_at,
              decided_at: d.decided_at ?? null,
            }))
          );
        }
      } catch {
        // silent
      } finally {
        setLoadingClaims(false);
      }
    };
    fetchClaims();
  }, []);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Protection Program
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discretionary platform assistance for qualifying trades
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Important Notice</p>
          <p className="text-xs text-amber-700 mt-1">
            This is a platform service, not insurance. Benefits are discretionary and subject
            to review. All dollar amounts represent maximums and are not guaranteed payouts.
          </p>
        </div>
      </div>

      {/* Current Tier */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Your Protection Level</h2>
              </div>
              <Badge
                variant="outline"
                className={
                  membershipTier === "elite"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : membershipTier === "pro"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }
              >
                {currentTier.name}
              </Badge>
              <p className="text-sm text-muted-foreground mt-3">{currentTier.description}</p>
            </div>
            {membershipTier === "free" && (
              <Button size="sm" asChild>
                <Link href="/dashboard/membership">
                  Upgrade <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          <h3 className="text-sm font-medium mb-3">Your Benefits</h3>
          <ul className="space-y-2">
            {currentTier.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {currentTier.maxCredit > 0 && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              Maximum discretionary platform credit: up to ${currentTier.maxCredit} per
              qualifying incident, subject to investigation.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Eligibility Checklist */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-primary" />
            Eligibility Checklist
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Meeting all requirements makes you eligible for Protection Program review.
            Eligibility does not guarantee benefits.
          </p>

          <div className="space-y-3">
            {eligibility.requirements.map((req) => (
              <div
                key={req.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  req.met
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {req.met ? (
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{req.label}</p>
                  <p className="text-xs text-muted-foreground">{req.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Badge
              variant="outline"
              className={
                eligibility.eligible
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }
            >
              {eligibility.eligible ? "Eligible for Review" : "Not Yet Eligible"}
            </Badge>
            {!eligibility.eligible && (
              <p className="text-xs text-muted-foreground">
                Complete the requirements above to become eligible.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File a Claim */}
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Need to File a Claim?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              File a dispute through our Dispute Resolution Center. All claims are
              reviewed individually.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/disputes">
              Go to Disputes <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Past Claims */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            Claim History
          </h2>
          {loadingClaims ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading claims...</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No claims filed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{claim.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Filed {new Date(claim.created_at).toLocaleDateString()}
                      {claim.decided_at &&
                        ` · Decided ${new Date(claim.decided_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {claim.credit_amount > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        ${claim.credit_amount} credit
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        claim.status === "resolved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : claim.status === "open"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      {claim.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compare Tiers */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Compare Protection Levels</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {allTiers.map((tier) => {
              const isCurrent = tier.tier === membershipTier;
              return (
                <div
                  key={tier.tier}
                  className={`p-4 rounded-lg border ${
                    isCurrent ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{tier.name}</h3>
                    {isCurrent && (
                      <Badge className="text-[10px]">Current</Badge>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {tier.benefits.map((b) => (
                      <li key={b} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {tier.maxCredit > 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Up to ${tier.maxCredit} discretionary credit
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full Disclaimer */}
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-medium">ℹ️ Disclaimer:</span> {PROTECTION_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
