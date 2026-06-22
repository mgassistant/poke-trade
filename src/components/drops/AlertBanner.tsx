"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Zap } from "lucide-react";

interface AlertBannerProps {
  message?: string;
  productUrl?: string;
  autoDismissMs?: number;
}

export function AlertBanner({
  message = "🔥 Prismatic Evolutions ETB back in stock at Pokémon Center!",
  productUrl = "/drops",
  autoDismissMs = 10000,
}: AlertBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => setVisible(false), autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs]);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
        <Zap className="h-4 w-4 shrink-0" />
        <Link href={productUrl} className="hover:underline truncate">
          {message}
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
