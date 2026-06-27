"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Camera, Package, Truck, CheckCircle, AlertTriangle,
  Loader2, Shield, Lock, Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  shipping_method: string;
  trade_protection_selected: boolean;
  locked_at: string | null;
  auto_cancel_at: string | null;
  fee_amount: number | null;
  fee_per_party: number | null;
  protection_amount: number | null;
  trade_value: number | null;
}

interface ShippingDetails {
  id: string;
  sender_tracking: string | null;
  sender_carrier: string | null;
  sender_shipped_at: string | null;
  sender_photos: string[];
  sender_received_at: string | null;
  sender_confirmed: boolean;
  receiver_tracking: string | null;
  receiver_carrier: string | null;
  receiver_shipped_at: string | null;
  receiver_photos: string[];
  receiver_received_at: string | null;
  receiver_confirmed: boolean;
  disputed: boolean;
  dispute_reason: string | null;
}

const CARRIERS = [
  { value: "usps", label: "USPS", hint: "20-22 digits or starts with 9" },
  { value: "ups", label: "UPS", hint: "Starts with 1Z" },
  { value: "fedex", label: "FedEx", hint: "12-15 digits" },
  { value: "dhl", label: "DHL", hint: "Any valid tracking" },
  { value: "other", label: "Other", hint: "Min 5 characters" },
];



/* Tracking validation (client-side mirror) */
function isValidTracking(num: string, carrier: string): { valid: boolean; error?: string } {
  const c = num.replace(/\s/g, "").toUpperCase();
  switch (carrier) {
    case "usps":
      if (/^9\d{15,21}$/.test(c) || /^\d{20,22}$/.test(c)) return { valid: true };
      return { valid: false, error: "USPS: 20-22 digits or starts with 9" };
    case "ups":
      if (/^1Z[A-Z0-9]{16,18}$/.test(c)) return { valid: true };
      return { valid: false, error: "UPS: must start with 1Z + 16-18 chars" };
    case "fedex":
      if (/^\d{12,15}$/.test(c)) return { valid: true };
      return { valid: false, error: "FedEx: 12-15 digits" };
    default:
      if (c.length >= 5) return { valid: true };
      return { valid: false, error: "Min 5 characters" };
  }
}

/* Countdown component */
function AutoCancelCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Deadline passed!"); setUrgent(true); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days}d ${hours}h remaining`);
      setUrgent(days < 2);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [targetDate]);

  return (
    <div className={`p-3 rounded-lg border flex items-center gap-2 ${
      urgent ? "bg-red-50 border-red-300" : "bg-orange-50 border-orange-200"
    }`}>
      <Clock className={`h-4 w-4 ${urgent ? "text-red-500" : "text-orange-500"}`} />
      <div>
        <p className={`text-sm font-medium ${urgent ? "text-red-700" : "text-orange-700"}`}>
          {urgent ? "⚠️ Deadline approaching!" : "⏳ Shipping deadline"}
        </p>
        <p className={`text-xs ${urgent ? "text-red-600" : "text-orange-600"}`}>
          {timeLeft} · Trade auto-cancels if neither party ships
        </p>
      </div>
    </div>
  );
}

export default function ShippingPage() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [shipping, setShipping] = useState<ShippingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  // Form states
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("usps");
  const [trackingError, setTrackingError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [shippingRes, settingsRes] = await Promise.all([
        fetch(`/api/trades/${tradeId}/shipping`),
        fetch("/api/settings"),
      ]);
      const shippingData = await shippingRes.json();
      const settingsData = await settingsRes.json();

      if (shippingData.trade) setTrade(shippingData.trade);
      if (shippingData.shipping) setShipping(shippingData.shipping);
      if (settingsData.profile?.id) setCurrentUserId(settingsData.profile.id);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isSender = trade?.sender_id === currentUserId;
  const isLocked = trade?.status === "locked";
  const isProtected = trade?.shipping_method === "protected";

  const myTracking = isSender ? shipping?.sender_tracking : shipping?.receiver_tracking;
  const theirTracking = isSender ? shipping?.receiver_tracking : shipping?.sender_tracking;
  const myPhotos = isSender ? shipping?.sender_photos || [] : shipping?.receiver_photos || [];
  const myShippedAt = isSender ? shipping?.sender_shipped_at : shipping?.receiver_shipped_at;
  const myConfirmed = isSender ? shipping?.sender_confirmed : shipping?.receiver_confirmed;
  const otherConfirmed = isSender ? shipping?.receiver_confirmed : shipping?.sender_confirmed;

  // Determine step
  const currentStep = useMemo(() => {
    if (!shipping) return 1;
    if (!myTracking) return 1;
    if (myTracking && !theirTracking) return 2;
    if (myTracking && theirTracking && !myConfirmed) return 3;
    if (myConfirmed && otherConfirmed) return 4;
    return 3;
  }, [shipping, myTracking, theirTracking, myConfirmed, otherConfirmed]);

  // Validate tracking on change
  useEffect(() => {
    if (!trackingNumber.trim()) { setTrackingError(""); return; }
    const result = isValidTracking(trackingNumber, carrier);
    setTrackingError(result.valid ? "" : result.error || "");
  }, [trackingNumber, carrier]);

  const doAction = async (action: string, extraData: Record<string, unknown> = {}) => {
    setActing(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActing(false);
    }
  };

  const handleAddTracking = () => {
    if (!trackingNumber.trim()) return;
    const validation = isValidTracking(trackingNumber, carrier);
    if (!validation.valid) {
      setTrackingError(validation.error || "Invalid tracking number");
      return;
    }
    doAction("add_tracking", { tracking_number: trackingNumber, carrier });
    setTrackingNumber("");
    setTrackingError("");
  };

  const handleUploadPhotos = () => {
    const photoUrl = prompt("Enter photo URL (paste image link):");
    if (photoUrl) {
      const existingPhotos = isSender ? shipping?.sender_photos || [] : shipping?.receiver_photos || [];
      doAction("upload_photos", { photos: [...existingPhotos, photoUrl] });
    }
  };


  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Trade not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const STEPS = [
    { num: 1, label: "Enter Tracking", icon: Package },
    { num: 2, label: "Awaiting Partner", icon: Clock },
    { num: 3, label: "Confirm Receipt", icon: CheckCircle },
    { num: 4, label: "Complete", icon: CheckCircle },
  ];

  const bothShipped = !!myTracking && !!theirTracking;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {isLocked ? "🔒" : "📦"} Shipping Workflow
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={
              isProtected
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-green-50 border-green-200 text-green-700"
            }>
              {isProtected ? "🛡️ Trade Protection" : "📦 Direct Trade"}
            </Badge>
            <Badge variant="outline" className={
              isLocked
                ? "bg-red-50 border-red-200 text-red-700 font-bold"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }>
              {isLocked ? "🔒 LOCKED" : trade.status}
            </Badge>
            {trade.protection_amount != null && trade.protection_amount > 0 && (
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                🛡️ Up to ${trade.protection_amount} protection
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Auto-cancel countdown */}
      {trade.auto_cancel_at && (isLocked || trade.status === "locked") && (
        <AutoCancelCountdown targetDate={trade.auto_cancel_at} />
      )}

      {/* Locked Trade Banner */}
      {isLocked && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-red-800">⏳ Trade Locked — Upload Shipping Confirmation to Continue</h3>
                <p className="text-xs text-red-600 mt-1">
                  Both parties must enter a valid tracking number. Cards are reserved and cannot be used in other trades until completed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.num === currentStep;
          const isDone = s.num < currentStep;
          return (
            <div key={s.num} className="flex items-center">
              {idx > 0 && (
                <div className={`w-6 sm:w-10 h-0.5 mx-0.5 ${isDone ? "bg-green-500" : "bg-gray-200"}`} />
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-[#E3350D] text-white shadow-md"
                    : isDone
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? <CheckCircle className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trade Protection Notice */}
      {isProtected && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-yellow-800">Trade Protection Active</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  Ship directly to your trade partner. Both parties must provide valid tracking numbers and photo proof.
                  Payment authorization is held until both parties confirm receipt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Enter Tracking Number */}
      <Card className={currentStep === 1 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 1 ? "bg-green-100 text-green-600" : currentStep === 1 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold">Enter Tracking Number</h3>
              <p className="text-xs text-muted-foreground">Ship your cards and provide tracking info</p>
            </div>
          </div>

          {myTracking ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <strong>✅ Your shipping confirmed</strong>
              </p>
              <p className="text-xs text-green-700 mt-1">
                Tracking: {myTracking} · Shipped {myShippedAt ? new Date(myShippedAt).toLocaleDateString() : ""}
              </p>
            </div>
          ) : currentStep === 1 ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number..."
                  className={`flex-1 ${trackingError ? "border-red-300 focus:ring-red-300" : ""}`}
                />
              </div>
              {/* Format hint */}
              <p className="text-xs text-muted-foreground">
                {CARRIERS.find((c) => c.value === carrier)?.hint}
              </p>
              {/* Validation error */}
              {trackingError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {trackingError}
                </p>
              )}
              {/* Validation success */}
              {trackingNumber.trim() && !trackingError && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Valid tracking format ✓
                </p>
              )}
              <Button
                onClick={handleAddTracking}
                disabled={acting || !trackingNumber.trim() || !!trackingError}
                className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Mark as Shipped
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Step 2: Waiting for other party */}
      <Card className={currentStep === 2 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 2 ? "bg-green-100 text-green-600" : currentStep === 2 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold">Waiting for Other Party</h3>
              <p className="text-xs text-muted-foreground">Both parties must submit tracking</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Your Shipping</p>
                <p className="text-xs text-muted-foreground">{myTracking || "Not shipped yet"}</p>
              </div>
              {myTracking ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">✅ Confirmed</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500 border-gray-200">⏳ Pending</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Their Shipping</p>
                <p className="text-xs text-muted-foreground">{theirTracking || "Not shipped yet"}</p>
              </div>
              {theirTracking ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">✅ Confirmed</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500 border-gray-200">⏳ Waiting</Badge>
              )}
            </div>
          </div>

          {bothShipped && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm font-medium text-green-800">📦 Both packages in transit!</p>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Step 3: Confirm Receipt */}
      <Card className={currentStep === 3 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 3 ? "bg-green-100 text-green-600" : currentStep === 3 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold">Confirm Receipt</h3>
              <p className="text-xs text-muted-foreground">Verify you received the cards in expected condition</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Your confirmation:</span>
              {myConfirmed ? (
                <Badge className="bg-green-100 text-green-700">✅ Confirmed</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500">Pending</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Their confirmation:</span>
              {otherConfirmed ? (
                <Badge className="bg-green-100 text-green-700">✅ Confirmed</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500">Pending</Badge>
              )}
            </div>
          </div>
          {currentStep === 3 && !myConfirmed && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => doAction("confirm_receipt")}
                disabled={acting}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Receipt
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  const reason = prompt("Describe the issue:");
                  if (reason) doAction("dispute", { reason });
                }}
                disabled={acting}
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> Open Dispute
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Complete */}
      {currentStep === 4 && (
        <Card className="ring-2 ring-green-500 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-white text-2xl font-bold">Trade Complete!</h2>
            <p className="text-white/80 mt-1">
              Both parties have confirmed receipt. Great trading!
            </p>
          </div>
          <CardContent className="p-6 text-center">
            <Button
              onClick={() => router.push(`/dashboard/reviews?trade=${tradeId}`)}
              className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2 px-6"
            >
              ⭐ Leave a Review
            </Button>
            <Button
              variant="outline"
              className="ml-3"
              onClick={() => router.push("/dashboard/trades")}
            >
              Back to Trades
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dispute banner */}
      {shipping?.disputed && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">Dispute Active</h3>
              <p className="text-sm text-red-700 mt-1">{shipping.dispute_reason}</p>
              <p className="text-xs text-red-500 mt-2">Our team will review and contact both parties.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
