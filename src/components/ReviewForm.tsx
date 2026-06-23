"use client";

import { useState } from "react";
import { Star, Loader2, Camera, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoryLabel, type ReputationCategories } from "@/lib/reputation";

interface ReviewFormProps {
  tradeId: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

interface CategoryRating {
  key: keyof Omit<ReputationCategories, "overall">;
  value: number;
  hover: number;
}

export function ReviewForm({ tradeId, onSubmit, onCancel }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(5);
  const [overallHover, setOverallHover] = useState(0);
  const [categories, setCategories] = useState<CategoryRating[]>([
    { key: "communication", value: 5, hover: 0 },
    { key: "accuracy", value: 5, hover: 0 },
    { key: "shipping", value: 5, hover: 0 },
    { key: "condition", value: 5, hover: 0 },
  ]);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCategory = (index: number, field: "value" | "hover", newVal: number) => {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: newVal } : cat))
    );
  };

  const renderStars = (
    rating: number,
    hoverVal: number,
    onRate: (star: number) => void,
    onHover: (star: number) => void,
    onLeave: () => void
  ) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          className="cursor-pointer"
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hoverVal || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/trades/${tradeId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: overallRating,
          communication_rating: categories[0].value,
          accuracy_rating: categories[1].value,
          shipping_rating: categories[2].value,
          condition_rating: categories[3].value,
          comment: comment || null,
          review_photos: photos.length > 0 ? photos : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      onSubmit?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Leave a Review</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Overall Rating */}
          <div>
            <label className="text-sm font-medium block mb-2">Overall Experience</label>
            {renderStars(
              overallRating,
              overallHover,
              setOverallRating,
              setOverallHover,
              () => setOverallHover(0)
            )}
          </div>

          {/* Category Ratings */}
          <div className="space-y-3 pt-2 border-t">
            <label className="text-xs font-semibold text-muted-foreground">Category Ratings</label>
            {categories.map((cat, idx) => (
              <div key={cat.key} className="flex items-center justify-between">
                <span className="text-sm">{getCategoryLabel(cat.key)}</span>
                {renderStars(
                  cat.value,
                  cat.hover,
                  (star) => updateCategory(idx, "value", star),
                  (star) => updateCategory(idx, "hover", star),
                  () => updateCategory(idx, "hover", 0)
                )}
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium block mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your trading experience?"
              className="w-full h-20 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          {/* Photos */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Photos of received item (optional, max 3)
            </label>
            {photos.length > 0 && (
              <div className="flex gap-2 mb-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border">
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-0 right-0 bg-black/50 rounded-bl p-0.5"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  // Photo upload would integrate with existing PhotoUpload component
                  // For now, placeholder
                }}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Add Photo
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              Submit Review
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
