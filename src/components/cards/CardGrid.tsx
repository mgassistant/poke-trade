"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { TCGCard } from "@/lib/pokemon-tcg";
import { getMarketPrice, formatCardPrice } from "@/lib/pokemon-tcg";

interface CardGridProps {
  cards: TCGCard[];
  variant?: "marketplace" | "showcase";
}

export function CardGrid({ cards, variant = "showcase" }: CardGridProps) {
  const validCards = cards.filter((c) => c.images?.large || c.images?.small);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
      {validCards.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="group"
        >
          <div className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,212,255,0.12)]">
            {/* Card Image */}
            <div className="relative aspect-[2.5/3.5] bg-muted/30 overflow-hidden">
              <Image
                src={card.images.large || card.images.small}
                alt={card.name}
                fill
                className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Card Info */}
            <div className="p-3">
              {card.rarity && (
                <Badge variant="outline" className="text-[10px] mb-1.5 border-primary/30 text-primary/80">
                  {card.rarity}
                </Badge>
              )}
              <h3 className="font-semibold text-sm truncate">{card.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{card.set.name}</p>
              {variant === "marketplace" && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary font-bold text-sm">
                    {formatCardPrice(getMarketPrice(card))}
                  </span>
                  {card.set.images.symbol && (
                    <Image
                      src={card.set.images.symbol}
                      alt={card.set.name}
                      width={16}
                      height={16}
                      className="opacity-50"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
