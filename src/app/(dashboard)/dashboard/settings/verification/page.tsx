"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, ShieldCheck, Mail, Phone, Fingerprint, MapPin,
  Check, ChevronRight, Loader2, ArrowLeft, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface VerificationStatus {
  email_verified: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  address_verified: boolean;
  verification_level: number;
  verification_data: Record<string, unknown>;
}

const LEVELS = [
  {
    level: 0,
    label: "Unverified",
    icon: Shield,
    color: "text-gray-400",
    bgColor: "bg-gray-100 border-gray-200",
    action: "Verify Email",
    type: "email",
    unlocks: ["Create an account", "Browse marketplace"],
  },
  {
    level: 1,
    label: "Email Verified",
    icon: Mail,
    color: "text-blue-500",
    bgColor: "bg-blue-50 border-blue-200",
    action: "Verify Phone",
    type: "phone",
    unlocks: ["3 trades/week", "$100 max trade value", "5 listings"],
  },
  {
    level: 2,
    label: "Phone Verified",
    icon: Phone,
    color: "text-green-500",
    bgColor: "bg-green-50 border-green-200",
    action: "Verify ID",
    type: "id",
    unlocks: ["10 trades/week", "$500 max trade value", "25 listings", "Selling enabled"],
  },
  {
    level: 3,
    label: "ID Verified",
    icon: Fingerprint,
    color: "text-amber-500",
    bgColor: "bg-amber-50 border-amber-200",
    action: "Verify Address",
    type: "address",
    unlocks: ["50 trades/week", "$5,000 max trade value", "100 listings", "Full access"],
  },
  {
    level: 4,
    label: "Fully Verified",
    icon: ShieldCheck,
    color: "text-purple-500",
    bgColor: "bg-purple-50 border-purple-200",
    action: null,
    type: null,
    unlocks: ["Unlimited trades", "No caps", "Priority support", "Maximum Trust Score bonus"],
  },
];

export default function VerificationPage() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ line1: "", city: "", state: "", zip: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/verification");
      const data = await res.json();
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (type: string) => {
    setActionLoading(true);
    setMessage("");

    try {
      if (type === "phone" && !showPhoneForm) {
        setShowPhoneForm(true);
        setActionLoading(false);
        return;
      }

      if (type === "address" && !showAddressForm) {
        setShowAddressForm(true);
        setActionLoading(false);
        return;
      }

      let bodyPayload: Record<string, unknown> = { type };

      if (type === "phone") {
        bodyPayload = { type, phone: phoneInput };
      } else if (type === "phone_verify") {
        bodyPayload = { type: "phone_verify", code: codeInput };
      } else if (type === "address") {
        bodyPayload = { type: "address", address: addressForm };
      }

      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (data.status === "email_sent") {
        setMessage("Verification email sent! Check your inbox.");
      } else if (data.status === "already_verified") {
        setMessage("Email already verified!");
        fetchStatus();
      } else if (data.status === "code_sent") {
        setShowPhoneForm(false);
        setShowCodeForm(true);
        setMessage("Verification code sent!");
      } else if (data.status === "verified") {
        setMessage("Verified successfully!");
        setShowCodeForm(false);
        setShowPhoneForm(false);
        setShowAddressForm(false);
        fetchStatus();
      } else if (data.status === "session_created" && data.url) {
        window.location.href = data.url;
        return;
      } else if (data.status === "coming_soon") {
        setMessage("ID verification is coming soon! Other verification methods are available now.");
      } else if (data.error) {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-2xl px-4 space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentLevel = status?.verification_level ?? 0;
  const progressPercent = (currentLevel / 4) * 100;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Verify your identity to unlock more features and increase your Trust Score.
        </p>

        {/* Progress bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Verification Level</span>
              <Badge className={LEVELS[currentLevel].bgColor + " " + LEVELS[currentLevel].color}>
                {LEVELS[currentLevel].label}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Level 0</span>
              <span>Level 1</span>
              <span>Level 2</span>
              <span>Level 3</span>
              <span>Level 4</span>
            </div>
          </CardContent>
        </Card>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
            {message}
          </div>
        )}

        {/* Verification Steps */}
        <div className="space-y-3">
          {LEVELS.map((lvl) => {
            const isCompleted = currentLevel >= lvl.level + 1 || (lvl.level === 4 && currentLevel === 4);
            const isCurrent = currentLevel === lvl.level && lvl.level < 4;
            const isLocked = currentLevel < lvl.level;
            const LevelIcon = lvl.icon;

            return (
              <Card
                key={lvl.level}
                className={`transition-all ${
                  isCurrent
                    ? "ring-2 ring-primary shadow-md"
                    : isCompleted
                    ? "opacity-80"
                    : isLocked
                    ? "opacity-50"
                    : ""
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div
                      className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center border ${
                        isCompleted
                          ? "bg-green-100 border-green-300 text-green-600"
                          : isCurrent
                          ? `${lvl.bgColor} ${lvl.color}`
                          : "bg-gray-100 border-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <LevelIcon className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">
                          Level {lvl.level}: {lvl.label}
                        </h3>
                        {isCompleted && (
                          <Badge variant="success" className="text-[10px]">
                            <Check className="h-3 w-3 mr-0.5" /> Done
                          </Badge>
                        )}
                      </div>

                      {/* Unlocks */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {lvl.unlocks.map((u) => (
                          <span
                            key={u}
                            className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                          >
                            {u}
                          </span>
                        ))}
                      </div>

                      {/* Action */}
                      {isCurrent && lvl.action && lvl.type && (
                        <div className="mt-3">
                          {/* Phone form */}
                          {lvl.type === "phone" && showPhoneForm && (
                            <div className="flex gap-2 mb-2">
                              <Input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleVerify("phone")}
                                disabled={actionLoading || !phoneInput}
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Send Code"
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Code form */}
                          {lvl.type === "phone" && showCodeForm && (
                            <div className="flex gap-2 mb-2">
                              <Input
                                type="text"
                                placeholder="123456"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                                maxLength={6}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleVerify("phone_verify")}
                                disabled={actionLoading || codeInput.length !== 6}
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Verify"
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Address form */}
                          {lvl.type === "address" && showAddressForm && (
                            <div className="space-y-2 mb-2">
                              <Input
                                placeholder="Street address"
                                value={addressForm.line1}
                                onChange={(e) =>
                                  setAddressForm({ ...addressForm, line1: e.target.value })
                                }
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  placeholder="City"
                                  value={addressForm.city}
                                  onChange={(e) =>
                                    setAddressForm({ ...addressForm, city: e.target.value })
                                  }
                                />
                                <Input
                                  placeholder="State"
                                  value={addressForm.state}
                                  onChange={(e) =>
                                    setAddressForm({ ...addressForm, state: e.target.value })
                                  }
                                />
                                <Input
                                  placeholder="ZIP"
                                  value={addressForm.zip}
                                  onChange={(e) =>
                                    setAddressForm({ ...addressForm, zip: e.target.value })
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleVerify("address")}
                                disabled={
                                  actionLoading ||
                                  !addressForm.line1 ||
                                  !addressForm.city ||
                                  !addressForm.state ||
                                  !addressForm.zip
                                }
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Verify Address"
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Main action button */}
                          {!(lvl.type === "phone" && (showPhoneForm || showCodeForm)) &&
                            !(lvl.type === "address" && showAddressForm) && (
                              <Button
                                size="sm"
                                onClick={() => handleVerify(lvl.type!)}
                                disabled={actionLoading}
                                className="gap-1"
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    {lvl.action}
                                    <ChevronRight className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            )}
                        </div>
                      )}

                      {/* Level 4 congrats */}
                      {lvl.level === 4 && currentLevel === 4 && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                            <Sparkles className="h-4 w-4" />
                            Congratulations! You&apos;re fully verified!
                          </div>
                          <p className="text-xs text-purple-600 mt-1">
                            You enjoy maximum Trust Score bonus, unlimited trades, and priority
                            support.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
