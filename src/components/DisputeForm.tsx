"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Upload, Loader2,
  CheckCircle, FileText, Camera, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REASON_CATEGORIES = [
  { value: "Item not received", icon: "📦", desc: "You never received the item" },
  { value: "Item not as described", icon: "❌", desc: "The item doesn't match the listing" },
  { value: "Counterfeit/fake", icon: "🚫", desc: "You believe the item is not authentic" },
  { value: "Damaged in shipping", icon: "📪", desc: "Item arrived damaged" },
  { value: "Seller didn't ship", icon: "🕐", desc: "Seller hasn't shipped after payment" },
  { value: "Buyer didn't pay", icon: "💳", desc: "Buyer hasn't completed payment" },
  { value: "Other", icon: "❓", desc: "Another issue not listed above" },
] as const;

interface DisputeFormProps {
  tradeId?: string;
  listingId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DisputeForm({
  tradeId,
  listingId,
  onSuccess,
  onCancel,
}: DisputeFormProps) {
  const [step, setStep] = useState(1);
  const [reasonCategory, setReasonCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoAdd = () => {
    // In a real app, this would open a file picker / upload to storage
    const url = prompt("Enter evidence photo URL:");
    if (url && photos.length < 10) {
      setPhotos([...photos, url]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_offer_id: tradeId || undefined,
          listing_id: listingId || undefined,
          reason_category: reasonCategory,
          description,
          evidence_photos: photos,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to file dispute");
        return;
      }
      onSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep1 = !!reasonCategory;
  const canProceedStep2 = description.trim().length >= 20;
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  s === step
                    ? "bg-primary text-white"
                    : s < step
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 w-8 ${
                    s < step ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Reason */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold mb-1">Step 1: Select Reason</h3>
            <p className="text-sm text-muted-foreground mb-4">
              What best describes your issue?
            </p>
            <div className="grid gap-2">
              {REASON_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setReasonCategory(cat.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    reasonCategory === cat.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{cat.value}</p>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Next <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Describe Issue */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold mb-1">Step 2: Describe the Issue</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Provide details about what happened (minimum 20 characters).
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/2000
            </p>
            <div className="flex justify-between mt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
              >
                Next <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Evidence */}
        {step === 3 && (
          <div>
            <h3 className="font-semibold mb-1">Step 3: Upload Evidence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add photos or screenshots to support your claim (up to 10).
            </p>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg border bg-gray-100 overflow-hidden group"
                >
                  <img
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <button
                  onClick={handlePhotoAdd}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
                >
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Add</span>
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Trade documentation and tracking info will be auto-attached.
            </p>

            <div className="flex justify-between mt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div>
            <h3 className="font-semibold mb-1">Step 4: Review & Submit</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Review your dispute details before submitting.
            </p>

            <div className="space-y-3 bg-muted/30 rounded-lg p-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="text-sm font-medium">{reasonCategory}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{description}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Evidence Photos</p>
                <p className="text-sm">{photos.length} photo(s) attached</p>
              </div>
              {tradeId && (
                <div>
                  <p className="text-xs text-muted-foreground">Trade ID</p>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{tradeId}</code>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> By submitting, you confirm that the information
                provided is accurate. False disputes may result in account penalties.
                Trade documentation and tracking info will be automatically included.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                variant="destructive"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1" />
                )}
                Submit Dispute
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
