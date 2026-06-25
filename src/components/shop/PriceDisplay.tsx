"use client";

interface PriceDisplayProps {
  msrpPrice?: number | null;
  marketPrice?: number | null;
  memberPrice?: number | null;
  premiumMemberPrice?: number | null;
  publicPrice?: number | null;
  showSavings?: boolean;
  compact?: boolean;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function PriceDisplay({
  msrpPrice,
  marketPrice,
  memberPrice,
  premiumMemberPrice,
  publicPrice,
  showSavings = true,
  compact = false,
}: PriceDisplayProps) {
  const displayPrice = memberPrice ?? publicPrice ?? marketPrice ?? 0;
  const comparePrice = msrpPrice ?? marketPrice;
  const savings =
    showSavings && comparePrice && memberPrice
      ? comparePrice - memberPrice
      : 0;
  const savingsPercent =
    savings > 0 && comparePrice ? Math.round((savings / comparePrice) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-gray-900">
          {formatPrice(displayPrice)}
        </span>
        {comparePrice && comparePrice > displayPrice && (
          <span className="text-sm text-gray-400 line-through">
            {formatPrice(comparePrice)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main price rows */}
      <div className="space-y-1">
        {msrpPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">MSRP</span>
            <span className="text-gray-400 line-through">
              {formatPrice(msrpPrice)}
            </span>
          </div>
        )}
        {marketPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Market Price</span>
            <span className="text-gray-400 line-through">
              {formatPrice(marketPrice)}
            </span>
          </div>
        )}
        {publicPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Price</span>
            <span className="text-gray-700 font-medium">
              {formatPrice(publicPrice)}
            </span>
          </div>
        )}
        {memberPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-red-600 font-medium">Member Price</span>
            <span className="text-red-600 font-bold text-lg">
              {formatPrice(memberPrice)}
            </span>
          </div>
        )}
        {premiumMemberPrice && premiumMemberPrice !== memberPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-amber-600 font-medium">Premium Price</span>
            <span className="text-amber-600 font-bold">
              {formatPrice(premiumMemberPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Savings callout */}
      {savings > 0 && savingsPercent > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
          <span className="text-green-700 text-sm font-medium">
            Members save {formatPrice(savings)} ({savingsPercent}% off)
          </span>
        </div>
      )}
    </div>
  );
}
