"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readonly = false, size = 24 }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered !== null ? star <= hovered : value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            onClick={() => {
              if (readonly) return;
              onChange(value === star ? null : star);
            }}
          >
            <Star
              size={size}
              className={`transition-colors ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
