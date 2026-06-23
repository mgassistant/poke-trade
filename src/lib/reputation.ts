/**
 * Poké-Trade Enhanced Reputation System
 *
 * Aggregates categorical review data into a comprehensive reputation profile.
 */

export interface ReputationCategories {
  communication: number;
  accuracy: number;
  shipping: number;
  condition: number;
  overall: number;
}

export interface ReputationProfile {
  overall: number;
  categories: ReputationCategories;
  totalReviews: number;
  tradeReviews: number;
  saleReviews: number;
}

export interface ReviewData {
  rating: number;
  communication_rating: number | null;
  accuracy_rating: number | null;
  shipping_rating: number | null;
  condition_rating: number | null;
  review_type: "trade" | "sale";
}

/**
 * Calculate a user's reputation from their review data.
 */
export function calculateReputation(reviews: ReviewData[]): ReputationProfile {
  if (reviews.length === 0) {
    return {
      overall: 0,
      categories: { communication: 0, accuracy: 0, shipping: 0, condition: 0, overall: 0 },
      totalReviews: 0,
      tradeReviews: 0,
      saleReviews: 0,
    };
  }

  const tradeReviews = reviews.filter((r) => r.review_type === "trade");
  const saleReviews = reviews.filter((r) => r.review_type === "sale");

  // Calculate category averages (only from reviews that have category ratings)
  const categoryAvg = (getter: (r: ReviewData) => number | null): number => {
    const rated = reviews.filter((r) => getter(r) !== null);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + (getter(r) || 0), 0) / rated.length;
  };

  const communication = categoryAvg((r) => r.communication_rating);
  const accuracy = categoryAvg((r) => r.accuracy_rating);
  const shipping = categoryAvg((r) => r.shipping_rating);
  const condition = categoryAvg((r) => r.condition_rating);
  const overallAvg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Overall is weighted: 40% overall rating, 15% each category
  const categoriesWithData = [communication, accuracy, shipping, condition].filter((c) => c > 0);
  const weightedOverall =
    categoriesWithData.length > 0
      ? overallAvg * 0.4 +
        (communication || overallAvg) * 0.15 +
        (accuracy || overallAvg) * 0.15 +
        (shipping || overallAvg) * 0.15 +
        (condition || overallAvg) * 0.15
      : overallAvg;

  return {
    overall: Math.round(weightedOverall * 100) / 100,
    categories: {
      communication: Math.round(communication * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      condition: Math.round(condition * 100) / 100,
      overall: Math.round(overallAvg * 100) / 100,
    },
    totalReviews: reviews.length,
    tradeReviews: tradeReviews.length,
    saleReviews: saleReviews.length,
  };
}

/**
 * Get the category label for display.
 */
export function getCategoryLabel(category: keyof ReputationCategories): string {
  const labels: Record<keyof ReputationCategories, string> = {
    communication: "Communication",
    accuracy: "Item Accuracy",
    shipping: "Shipping & Packaging",
    condition: "Card Condition",
    overall: "Overall Experience",
  };
  return labels[category];
}

/**
 * Get a descriptive label for a rating value.
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Average";
  if (rating >= 1.5) return "Below Average";
  return "Poor";
}

/**
 * Get star color for rating value.
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 3.5) return "text-blue-600";
  if (rating >= 2.5) return "text-yellow-600";
  if (rating >= 1.5) return "text-orange-600";
  return "text-red-600";
}
