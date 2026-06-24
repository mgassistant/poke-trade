"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { TCGCard } from "@/lib/pokemon-tcg";

interface FeaturedListingsProps {
  cards: TCGCard[];
}

export function FeaturedListings({ cards }: FeaturedListingsProps) {
  if (cards.length === 0) return null;

  return (
    <section className="py-24 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Trending <span className="text-red-500">Cards</span>
            </h2>
            <p className="mt-2 text-slate-400">
              Real-time data from the Pokémon TCG market
            </p>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.slice(0, 8).map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={`/card/${card.id}`}
                className="group block rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
              >
                {/* Card Image */}
                <div className="relative aspect-[2.5/3.5] bg-gradient-to-br from-slate-800 to-slate-900 p-3">
                  {card.images?.small ? (
                    <Image
                      src={card.images.small}
                      alt={card.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">
                      No Image
                    </div>
                  )}

                  {/* Grade badge (PSA-style) */}
                  {card.rarity && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-500/90 text-[10px] font-bold text-white uppercase tracking-wider">
                      {card.rarity.includes("Rare") ? "RARE" : card.rarity.slice(0, 6)}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {card.set?.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {card.cardmarket?.prices?.averageSellPrice
                        ? `$${card.cardmarket.prices.averageSellPrice.toFixed(2)}`
                        : card.tcgplayer?.prices?.holofoil?.market
                          ? `$${card.tcgplayer.prices.holofoil.market.toFixed(2)}`
                          : "—"}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                      NM
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            View All Listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
