"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, Crown, Zap, Check, X, Loader2, Star, TrendingDown, BadgeCheck, Sparkles,
  Bell, Lock, CheckCircle2, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MembershipInfo {
  tier: "free" | "pro" | "elite";
  is_premium: boolean;
  has_stripe_customer: boolean;
}

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    priceDesc: "forever",
    icon: Shield,
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/30",
    features: [
      { text: "5% platform fee", included: true, highlight: false },
      { text: "Basic marketplace access", included: true, highlight: false },
      { text: "Up to 10 active listings", included: true, highlight: false },
      { text: "Standard support", included: true, highlight: false },
      { text: "Trade Protection: None", included: false, highlight: false },
      { text: "Priority listings", included: false, highlight: false },
      { text: "Advanced analytics", included: false, highlight: false },
      { text: "Verified seller badge", included: false, highlight: false },
      { text: "Featured listings", included: false, highlight: false },
      { text: "Early access to drops", included: false, highlight: false },
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$9.99",
    priceDesc: "/month",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    popular: true,
    features: [
      { text: "3% platform fee", included: true, highlight: true },
      { text: "Full marketplace access", included: true, highlight: false },
      { text: "Up to 50 active listings", included: true, highlight: false },
      { text: "Priority support", included: true, highlight: false },
      { text: "Trade Protection: Up to $50 discretionary platform credit per trade", included: true, highlight: true },
      { text: "Priority listings", included: true, highlight: false },
      { text: "Advanced analytics", included: true, highlight: false },
      { text: "Verified seller badge", included: false, highlight: false },
      { text: "Featured listings", included: false, highlight: false },
      { text: "Early access to drops", included: false, highlight: false },
    ],
  },
  {
    id: "elite" as const,
    name: "Elite",
    price: "$19.99",
    priceDesc: "/month",
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    features: [
      { text: "3% platform fee", included: true, highlight: true },
      { text: "Full marketplace access", included: true, highlight: false },
      { text: "Unlimited listings", included: true, highlight: false },
      { text: "Priority support", included: true, highlight: false },
      { text: "Trade Protection: Up to $100 discretionary platform credit per trade", included: true, highlight: true },
      { text: "Priority listings", included: true, highlight: false },
      { text: "Advanced analytics", included: true, highlight: false },
      { text: "Verified seller badge", included: true, highlight: false },
      { text: "Featured listings", included: true, highlight: false },
      { text: "Early access to drops", included: true, highlight: false },
    ],
  },
];

export default function MembershipPage() {
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/membership");
        const data = await res.json();
        setMembership(data);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccessMsg("Subscription activated! Welcome aboard 🎉");
      // Refresh membership data
      setTimeout(async () => {
        try {
          const res = await fetch("/api/membership");
          const data = await res.json();
          setMembership(data);
        } catch {}
      }, 2000);
    }
  }, []);

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier);
    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch {
      alert("Failed to start checkout");
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep your benefits until the end of the billing period.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/membership/cancel", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Subscription cancelled");
        const refreshRes = await fetch("/api/membership");
        const refreshData = await refreshRes.json();
        setMembership(refreshData);
      } else {
        alert(data.error || "Failed to cancel");
      }
    } catch {
      alert("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const currentTier = membership?.tier || "free";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Membership</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription and unlock premium features
        </p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <Card>
          <CardContent className="p-4 bg-green-500/10 border-green-500/30">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" /> {successMsg}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const tier = TIERS.find((t) => t.id === currentTier) || TIERS[0];
                  const Icon = tier.icon;
                  return (
                    <>
                      <div className={`h-12 w-12 rounded-xl ${tier.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${tier.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">{tier.name} Plan</h2>
                          {currentTier !== "free" && (
                            <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tier.price}{tier.priceDesc}
                          {currentTier !== "free" && " · Billed monthly"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              {currentTier !== "free" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-xs"
                >
                  {cancelling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Cancel Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isCurrent = currentTier === tier.id;
          const isUpgrade = TIERS.findIndex((t) => t.id === tier.id) > TIERS.findIndex((t) => t.id === currentTier);

          return (
            <Card
              key={tier.id}
              className={`overflow-hidden relative ${
                tier.popular ? "ring-2 ring-primary" : ""
              } ${isCurrent ? `ring-2 ${tier.borderColor}` : ""}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <CardContent className="p-6 space-y-6">
                {/* Plan Header */}
                <div className="text-center">
                  <div className={`h-14 w-14 rounded-2xl ${tier.bgColor} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`h-7 w-7 ${tier.color}`} />
                  </div>
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <div className="mt-1">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.priceDesc}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2.5">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className={`h-4 w-4 shrink-0 ${feature.highlight ? "text-green-400" : "text-primary"}`} />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground/50"}>
                        {feature.text}
                      </span>
                      {feature.highlight && (
                        <Badge className="text-[8px] bg-green-500/20 text-green-400 border-green-500/30 px-1">
                          SAVE
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={!!upgrading}
                      className="w-full gap-2"
                    >
                      {upgrading === tier.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Upgrade to {tier.name}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full text-muted-foreground">
                      Downgrade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Lower Fees</p>
              <p className="text-xs text-muted-foreground">Save 2% per sale with Pro or Elite</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Verified Badge</p>
              <p className="text-xs text-muted-foreground">Build trust with Elite verification</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Featured Listings</p>
              <p className="text-xs text-muted-foreground">Get your cards seen first</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drop Alerts Add-On */}
      <DropAlertsAddon />

      {/* Trade Protection Footnote */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        * Trade Protection benefits are subject to review and platform terms. See{" "}
        <a href="/terms" className="text-primary hover:underline">Terms of Service</a> for details.
      </p>
    </div>
  );
}

/* ────────── Drop Alerts Add-On Section ────────── */

function DropAlertsAddon() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/drops/subscribe");
        const data = await res.json();
        setActive(data.active === true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/drops/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Failed to start checkout.");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${active ? "border-green-200" : "border-amber-200"}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              active ? "bg-green-100" : "bg-amber-100"
            }`}>
              <Zap className={`h-6 w-6 ${active ? "text-green-500" : "text-amber-500"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Drop Alerts Add-On</h2>
                {active ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                    <Lock className="h-3 w-3 mr-1" />
                    Not subscribed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {active
                  ? "Instant alerts across 8 retailers · $5.99/mo"
                  : "Get instant restock & price drop alerts · $5.99/mo"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {active ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/drops">
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    Manage
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                )}
                {subscribing ? "Loading..." : "Subscribe — $5.99/mo"}
              </Button>
            )}
          </div>
        </div>

        {/* Feature comparison */}
        {!active && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "🟢", text: "Restock alerts" },
                { icon: "💰", text: "Price drops" },
                { icon: "🆕", text: "New releases" },
                { icon: "⚠️", text: "Low stock" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
