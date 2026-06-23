"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, ExternalLink, Loader2, CheckCircle2,
  AlertTriangle, Wallet, ArrowRight, Building2, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ConnectStatus {
  connected: boolean;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
}

interface PayoutData {
  available_balance: number;
  pending_balance: number;
  payouts: {
    id: string;
    amount: number;
    status: string;
    arrival_date: string;
    created: string;
  }[];
}

export default function SellerSetupPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [payouts, setPayouts] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/connect/status");
      const data = await res.json();
      setStatus(data);

      if (data.payouts_enabled) {
        const payoutRes = await fetch("/api/connect/payout");
        const payoutData = await payoutRes.json();
        if (!payoutData.error) setPayouts(payoutData);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to start onboarding");
    } finally {
      setConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    setOpeningDashboard(true);
    try {
      const res = await fetch("/api/connect/dashboard", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(data.error || "Failed to open dashboard");
      }
    } catch {
      alert("Failed to open dashboard");
    } finally {
      setOpeningDashboard(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seller Setup</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your bank account to receive payouts from sales
        </p>
      </div>

      {/* Status Card */}
      <Card className={`${
        status?.payouts_enabled
          ? "border-green-200 bg-green-50/50"
          : status?.details_submitted
          ? "border-yellow-200 bg-yellow-50/50"
          : "border-border"
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
              status?.payouts_enabled
                ? "bg-green-100"
                : status?.details_submitted
                ? "bg-yellow-100"
                : "bg-muted"
            }`}>
              {status?.payouts_enabled ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : status?.details_submitted ? (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              ) : (
                <Wallet className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {status?.payouts_enabled
                  ? "✅ Payouts Enabled"
                  : status?.details_submitted
                  ? "⚠️ Setup In Progress"
                  : "Connect Your Bank Account"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {status?.payouts_enabled
                  ? "Your account is set up to receive payouts. Funds from sales are automatically transferred to your bank."
                  : status?.details_submitted
                  ? "Your account is being reviewed by Stripe. This usually takes 1-2 business days."
                  : "Link your bank account through Stripe to start receiving payouts from your card sales. Poké-Trade takes a small platform fee (5% free tier, 3% Pro/Elite)."}
              </p>

              <div className="mt-4 flex gap-3 flex-wrap">
                {!status?.payouts_enabled && (
                  <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                    {connecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    {status?.details_submitted ? "Complete Setup" : "Connect Bank Account"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                {status?.connected && (
                  <Button
                    variant="outline"
                    onClick={handleOpenDashboard}
                    disabled={openingDashboard}
                    className="gap-2"
                  >
                    {openingDashboard ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    View Stripe Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: "Free", fee: "5%", desc: "Standard marketplace fee" },
              { tier: "Pro", fee: "3%", desc: "Reduced fee for Pro members" },
              { tier: "Elite", fee: "3%", desc: "Lowest fee for Elite members" },
            ].map((plan) => (
              <div key={plan.tier} className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{plan.tier}</p>
                <p className="text-2xl font-bold text-primary mt-1">{plan.fee}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{plan.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Dashboard */}
      {status?.payouts_enabled && payouts && (
        <>
          {/* Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-lg font-bold text-green-600">${payouts.available_balance.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Balance</p>
                  <p className="text-lg font-bold text-yellow-600">${payouts.pending_balance.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payout History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No payouts yet. Payouts are processed automatically after successful sales.
                </p>
              ) : (
                <div className="space-y-2">
                  {payouts.payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">${payout.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(payout.created).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-[10px] ${
                          payout.status === "paid"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : payout.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}>
                          {payout.status}
                        </Badge>
                        {payout.status === "pending" && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Arrives {new Date(payout.arrival_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
