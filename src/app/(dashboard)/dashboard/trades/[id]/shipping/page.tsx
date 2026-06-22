"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Camera, Package, Truck, CheckCircle, AlertTriangle,
  Loader2, Shield, ExternalLink, Copy
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
  verification_fee_paid: boolean;
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
  auth_center_received_sender: string | null;
  auth_center_received_receiver: string | null;
  auth_center_verified: boolean;
  auth_center_notes: string | null;
  auth_center_cross_ship_sender_tracking: string | null;
  auth_center_cross_ship_receiver_tracking: string | null;
  inspection_deadline: string | null;
  disputed: boolean;
  dispute_reason: string | null;
}

type ShippingStep = 1 | 2 | 3 | 4 | 5;

const CARRIERS = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
];

const AUTH_CENTER_ADDRESS = "Poké-Trade Verification Center\n123 Trade Lane, Suite 200\nPokemon City, CA 90210";

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
  const [disputeReason, setDisputeReason] = useState("");

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

  // Determine current shipping step
  const getShippingStep = (): ShippingStep => {
    if (!shipping) return 1;
    const myPhotos = isSender ? shipping.sender_photos : shipping.receiver_photos;
    const myTracking = isSender ? shipping.sender_tracking : shipping.receiver_tracking;
    const myConfirmed = isSender ? shipping.sender_confirmed : shipping.receiver_confirmed;
    const otherConfirmed = isSender ? shipping.receiver_confirmed : shipping.sender_confirmed;

    if (!myPhotos?.length) return 1;
    if (!myTracking) return 2;
    if (!myConfirmed && !otherConfirmed) return 3;
    if (myConfirmed && otherConfirmed) return 5;
    return 4;
  };

  const currentStep = getShippingStep();

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
    doAction("add_tracking", { tracking_number: trackingNumber, carrier });
    setTrackingNumber("");
  };

  const handleUploadPhotos = () => {
    // In production, this would open a file picker and upload to storage
    // For now, we'll use a placeholder URL
    const photoUrl = prompt("Enter photo URL (paste image link):");
    if (photoUrl) {
      const existingPhotos = isSender ? shipping?.sender_photos || [] : shipping?.receiver_photos || [];
      doAction("upload_photos", { photos: [...existingPhotos, photoUrl] });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(AUTH_CENTER_ADDRESS.replace(/\n/g, ", "));
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
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isVerified = trade.shipping_method === "verified";
  const myTracking = isSender ? shipping?.sender_tracking : shipping?.receiver_tracking;
  const theirTracking = isSender ? shipping?.receiver_tracking : shipping?.sender_tracking;
  const myPhotos = isSender ? shipping?.sender_photos || [] : shipping?.receiver_photos || [];
  const myShippedAt = isSender ? shipping?.sender_shipped_at : shipping?.receiver_shipped_at;
  const myConfirmed = isSender ? shipping?.sender_confirmed : shipping?.receiver_confirmed;
  const otherConfirmed = isSender ? shipping?.receiver_confirmed : shipping?.sender_confirmed;

  const STEPS = [
    { num: 1, label: "Upload Photos", icon: Camera },
    { num: 2, label: "Ship Cards", icon: Package },
    { num: 3, label: "Track", icon: Truck },
    { num: 4, label: "Confirm", icon: CheckCircle },
    { num: 5, label: "Complete", icon: CheckCircle },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📦 Shipping Workflow
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={
              isVerified
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-green-50 border-green-200 text-green-700"
            }>
              {isVerified ? "🛡️ Poké-Trade Verified" : "📦 Direct Ship"}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              {trade.status}
            </Badge>
          </div>
        </div>
      </div>

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

      {/* Verified Trade: Auth Center Address */}
      {isVerified && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-yellow-800">Ship to Poké-Trade Verification Center</h3>
                <pre className="text-sm text-yellow-700 mt-2 whitespace-pre-line font-sans">
                  {AUTH_CENTER_ADDRESS}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                  onClick={copyAddress}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy Address
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Upload Photos */}
      <Card className={currentStep === 1 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 1 ? "bg-green-100 text-green-600" : currentStep === 1 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold">Upload Card Photos</h3>
              <p className="text-xs text-muted-foreground">Proof of condition before shipping</p>
            </div>
          </div>
          {myPhotos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {myPhotos.map((url, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-muted relative border">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
          {currentStep === 1 && (
            <Button
              onClick={handleUploadPhotos}
              disabled={acting}
              className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2"
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {myPhotos.length > 0 ? "Add More Photos" : "Upload Photos"}
            </Button>
          )}
          {myPhotos.length > 0 && currentStep === 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              ✅ {myPhotos.length} photo(s) uploaded. You can proceed to shipping.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Ship Cards */}
      <Card className={currentStep === 2 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 2 ? "bg-green-100 text-green-600" : currentStep === 2 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold">Ship Your Cards</h3>
              <p className="text-xs text-muted-foreground">Enter your tracking number after shipping</p>
            </div>
          </div>
          {myTracking ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Tracking:</strong> {myTracking}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Shipped {myShippedAt ? new Date(myShippedAt).toLocaleDateString() : ""}
              </p>
            </div>
          ) : currentStep === 2 ? (
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
                  className="flex-1"
                />
              </div>
              <Button
                onClick={handleAddTracking}
                disabled={acting || !trackingNumber.trim()}
                className="bg-[#E3350D] hover:bg-[#c72e0b] gap-2"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Mark as Shipped
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Step 3: Track Shipments */}
      <Card className={currentStep === 3 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 3 ? "bg-green-100 text-green-600" : currentStep === 3 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold">Track Shipments</h3>
              <p className="text-xs text-muted-foreground">Monitor both packages</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Your Package</p>
                <p className="text-xs text-muted-foreground">
                  {myTracking || "Not shipped yet"}
                </p>
              </div>
              {myTracking && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {myShippedAt ? "Shipped" : "Pending"}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Their Package</p>
                <p className="text-xs text-muted-foreground">
                  {theirTracking || "Not shipped yet"}
                </p>
              </div>
              {theirTracking && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Shipped
                </Badge>
              )}
            </div>
          </div>

          {/* Verified trade: auth center status */}
          {isVerified && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-bold text-yellow-800 mb-2">🔍 Verification Status</h4>
              <div className="space-y-1.5 text-xs text-yellow-700">
                <p>
                  Sender package received:{" "}
                  {shipping?.auth_center_received_sender
                    ? `✅ ${new Date(shipping.auth_center_received_sender).toLocaleDateString()}`
                    : "⏳ Pending"}
                </p>
                <p>
                  Receiver package received:{" "}
                  {shipping?.auth_center_received_receiver
                    ? `✅ ${new Date(shipping.auth_center_received_receiver).toLocaleDateString()}`
                    : "⏳ Pending"}
                </p>
                <p>
                  Verification:{" "}
                  {shipping?.auth_center_verified
                    ? "✅ Cards Verified!"
                    : "⏳ Awaiting verification"}
                </p>
                {shipping?.auth_center_notes && (
                  <p className="mt-1 italic">Notes: {shipping.auth_center_notes}</p>
                )}
                {shipping?.auth_center_cross_ship_sender_tracking && (
                  <p className="mt-2">
                    Cross-ship to you: {isSender
                      ? shipping.auth_center_cross_ship_sender_tracking
                      : shipping.auth_center_cross_ship_receiver_tracking}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Confirm Receipt */}
      <Card className={currentStep === 4 ? "ring-2 ring-[#E3350D] shadow-lg" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep > 4 ? "bg-green-100 text-green-600" : currentStep === 4 ? "bg-[#E3350D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep > 4 ? <CheckCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
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
          {currentStep === 4 && !myConfirmed && (
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

      {/* Step 5: Complete */}
      {currentStep === 5 && (
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
