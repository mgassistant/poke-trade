"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: ReviewProfile;
  reviewee?: ReviewProfile;
  trade_offer?: { id: string; created_at: string; status: string } | null;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
}

type ReviewTab = "received" | "given";

function ReviewsContent() {
  const searchParams = useSearchParams();
  const tradeId = searchParams.get("trade");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewTab>("received");

  // Leave review
  const [showReviewForm, setShowReviewForm] = useState(!!tradeId);
  const [reviewTradeId, setReviewTradeId] = useState(tradeId || "");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?tab=${tab}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
      if (data.stats) setStats(data.stats);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async () => {
    if (!reviewTradeId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trades/${reviewTradeId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowReviewForm(false);
        setReviewTradeId("");
        setReviewComment("");
        setReviewRating(5);
        fetchReviews();
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setReviewRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (interactive ? (hoverRating || reviewRating) : rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">Reviews you&apos;ve given and received</p>
        </div>
        {!showReviewForm && (
          <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)} className="gap-2">
            <Star className="h-4 w-4" /> Leave Review
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {renderStars(Math.round(stats.average_rating))}
            </div>
            <div className="text-xl font-bold">{stats.average_rating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-xl font-bold">{stats.total_reviews}</div>
            <div className="text-xs text-muted-foreground">Total Reviews</div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Review Form */}
      {showReviewForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Leave a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Trade ID</label>
                <input
                  type="text"
                  value={reviewTradeId}
                  onChange={(e) => setReviewTradeId(e.target.value)}
                  placeholder="Enter the completed trade ID"
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Rating</label>
                {renderStars(reviewRating, true)}
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was your trading experience?"
                  className="w-full h-20 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground resize-none"
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} disabled={submitting || !reviewTradeId} className="gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                  Submit Review
                </Button>
                <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => setTab("received")}
          className={`flex-1 text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "received" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Received
        </button>
        <button
          onClick={() => setTab("given")}
          className={`flex-1 text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "given" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Given
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Star className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No {tab} reviews</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {tab === "received"
                ? "Complete some trades to start receiving reviews!"
                : "You haven't left any reviews yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const person = tab === "received" ? review.reviewer : review.reviewee;
            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {person?.avatar_url ? (
                        <Image src={person.avatar_url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {(person?.display_name || person?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {person?.display_name || person?.username || "Unknown"}
                        </span>
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Reviews</h1></div>
        <Skeleton className="h-32 w-full" />
      </div>
    }>
      <ReviewsContent />
    </Suspense>
  );
}
