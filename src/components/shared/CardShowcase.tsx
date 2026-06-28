"use client";

import Image from "next/image";
import { SHOWCASE_CARDS } from "@/lib/tcgplayer-products";

interface CardShowcaseProps {
  /** How many cards to show */
  count?: number;
  /** Starting index in the showcase array */
  offset?: number;
  /** Layout variant */
  variant?: "fan" | "grid" | "floating" | "stack" | "row";
  /** Additional className */
  className?: string;
}

/**
 * Decorative card display for marketing pages
 * Uses real high-value Pokémon card images from pokemontcg.io
 */
export function CardShowcase({ count = 3, offset = 0, variant = "fan", className = "" }: CardShowcaseProps) {
  const cards = SHOWCASE_CARDS.slice(offset, offset + count);

  if (variant === "fan") {
    return (
      <div className={`relative h-64 w-64 mx-auto ${className}`}>
        {cards.map((card, i) => {
          const rotation = (i - Math.floor(cards.length / 2)) * 15;
          const translateX = (i - Math.floor(cards.length / 2)) * 20;
          return (
            <div
              key={card.id}
              className="absolute top-0 left-1/2 w-36 transition-transform duration-500 hover:scale-110 hover:z-10"
              style={{
                transform: `translateX(calc(-50% + ${translateX}px)) rotate(${rotation}deg)`,
                zIndex: i,
              }}
            >
              <Image
                src={card.image}
                alt={card.name}
                width={250}
                height={350}
                className="rounded-lg shadow-xl"
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className={`relative ${className}`} aria-hidden="true">
        {cards.map((card, i) => {
          const positions = [
            "top-0 left-0 -rotate-12",
            "top-4 right-0 rotate-6",
            "bottom-0 left-1/4 -rotate-3",
            "top-1/3 right-1/4 rotate-12",
            "bottom-4 right-0 -rotate-6",
          ];
          return (
            <div
              key={card.id}
              className={`absolute w-24 sm:w-32 opacity-20 hover:opacity-60 transition-opacity duration-300 ${positions[i % positions.length]}`}
            >
              <Image
                src={card.image}
                alt=""
                width={150}
                height={210}
                className="rounded-lg"
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        {cards.map((card) => (
          <div key={card.id} className="w-28 sm:w-36 hover:scale-105 transition-transform">
            <Image
              src={card.image}
              alt={card.name}
              width={200}
              height={280}
              className="rounded-lg shadow-lg"
            />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "stack") {
    return (
      <div className={`relative h-48 w-36 mx-auto ${className}`}>
        {cards.map((card, i) => (
          <div
            key={card.id}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${i * 8}px) translateX(${i * 4}px)`,
              zIndex: cards.length - i,
            }}
          >
            <Image
              src={card.image}
              alt={card.name}
              width={200}
              height={280}
              className="rounded-lg shadow-md"
            />
          </div>
        ))}
      </div>
    );
  }

  // grid
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${className}`}>
      {cards.map((card) => (
        <div key={card.id} className="hover:scale-105 transition-transform">
          <Image
            src={card.image}
            alt={card.name}
            width={200}
            height={280}
            className="rounded-lg shadow-lg w-full"
          />
          <p className="text-xs text-muted-foreground text-center mt-1">{card.name}</p>
        </div>
      ))}
    </div>
  );
}
