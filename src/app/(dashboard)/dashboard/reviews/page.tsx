"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Star, Loader2, MessageSquare, Filter, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReputationCard } from "@/components/ReputationCard";
import { ReviewForm } from "@/components/ReviewForm";
import type { ReputationProfile } from "@/lib/reputation";

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
  communication_rating: number | null;
  accuracy_rating: number | null;
  shipping_rating: number | null;
  condition_rating: number | null;
  comment: string | null;
  seller_response: string | null;
  seller_response_at: string | null;
  review_type: string;
  created_at: string;
  reviewer?: ReviewProfile;
  reviewee?: ReviewProfile;
  trade_offer?: { id: string; created_at: string; status: string } | null;
}

type ReviewTab = "received" | "given";
type ReviewFilter = "all" | "trade" | "sale" | "5-star" | "1-star";

function ReviewsContent() {
  const searchParams = useSearchParams();
  const tradeId = searchParams.get("trade");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reputation, setReputation] = useState<ReputationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewTab>("received");
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [showReviewForm, setShowReviewForm] = useState(!!tradeId);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?tab=${tab}&filter=${filter}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
      if (data.reputation) setReputation(data.reputation);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab, filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSendingResponse(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, response: responseText }),
      });
      if (res.ok) {
        setRespondingTo(null);
        setResponseText("");
        fetchReviews();
      }
    } catch {
      // silent
    } finally {
      setSendingResponse(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );

  const filters: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "trade", label: "Trades" },
    { key: "sale", label: "Sales" },
    { key: "5-star", label: "5★" },
    { key: "1-star", label: "1★" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">Your trading reputation</p>
        </div>
        {!showReviewForm && (
          <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)} className="gap-2">
            <Star className="h-4 w-4" /> Leave Review
          </Button>
        )}
      </div>

      {/* Reputation Card */}
      {reputation && <ReputationCard reputation={reputation} />}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          tradeId={tradeId || ""}
          onSubmit={() => {
            setShowReviewForm(false);
            fetchReviews();
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => setTab("received")}
          className={`flex-1 text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "received" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reviews I&apos;ve Received
        </button>
        <button
          onClick={() => setTab("given")}
          className={`flex-1 text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "given" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reviews I&apos;ve Given
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
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
            <h3 className="font-semibold mb-1">No reviews found</h3>
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
                        <Badge variant="outline" className="text-xs">
                          {review.review_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Category ratings */}
                      {(review.communication_rating || review.accuracy_rating || review.shipping_rating || review.condition_rating) && (
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {review.communication_rating && (
                            <span>Comm: {"★".repeat(review.communication_rating)}</span>
                          )}
                          {review.accuracy_rating && (
                            <span>Accuracy: {"★".repeat(review.accuracy_rating)}</span>
                          )}
                          {review.shipping_rating && (
                            <span>Shipping: {"★".repeat(review.shipping_rating)}</span>
                          )}
                          {review.condition_rating && (
                            <span>Condition: {"★".repeat(review.condition_rating)}</span>
                          )}
                        </div>
                      )}

                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          {review.comment}
                        </p>
                      )}

                      {/* Seller Response */}
                      {review.seller_response && (
                        <div className="mt-2 ml-4 pl-3 border-l-2 border-blue-200">
                          <p className="text-xs font-medium text-blue-700">Seller Response:</p>
                          <p className="text-sm text-muted-foreground">{review.seller_response}</p>
                        </div>
                      )}

                      {/* Respond button (only for received reviews without response) */}
                      {tab === "received" && !review.seller_response && (
                        <>
                          {respondingTo === review.id ? (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Write your response..."
                                maxLength={500}
                                className="flex-1 h-8 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSubmitResponse(review.id)}
                                disabled={sendingResponse || !responseText.trim()}
                                className="gap-1"
                              >
                                {sendingResponse ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRespondingTo(null);
                                  setResponseText("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRespondingTo(review.id)}
                              className="mt-1 text-xs gap-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Respond
                            </Button>
                          )}
                        </>
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
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Reviews</h1>
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <ReviewsContent />
    </Suspense>
  );
}
