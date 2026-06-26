"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import type { TCGCard } from "@/lib/pokemon-tcg";

interface FeaturedListingsProps {
  cards: TCGCard[];
}

// Fallback cards when API returns empty
const FALLBACK_CARDS: TCGCard[] = [
  {
    id: "swsh4-25",
    name: "Charizard VMAX",
    supertype: "Pokémon",
    number: "25",
    rarity: "Rare Holo",
    images: { small: "https://images.pokemontcg.io/swsh4/25.png", large: "https://images.pokemontcg.io/swsh4/25_hires.png" },
    set: { id: "swsh4", name: "Vivid Voltage", series: "Sword & Shield", printedTotal: 185, total: 203, releaseDate: "2020/11/13", images: { symbol: "", logo: "" } },
  },
  {
    id: "swsh7-203",
    name: "Umbreon VMAX",
    supertype: "Pokémon",
    number: "203",
    rarity: "Rare Secret",
    images: { small: "https://images.pokemontcg.io/swsh7/203.png", large: "https://images.pokemontcg.io/swsh7/203_hires.png" },
    set: { id: "swsh7", name: "Evolving Skies", series: "Sword & Shield", printedTotal: 203, total: 237, releaseDate: "2021/08/27", images: { symbol: "", logo: "" } },
  },
  {
    id: "sm35-1",
    name: "Charizard GX",
    supertype: "Pokémon",
    number: "1",
    rarity: "Rare Holo GX",
    images: { small: "https://images.pokemontcg.io/sm35/1.png", large: "https://images.pokemontcg.io/sm35/1_hires.png" },
    set: { id: "sm35", name: "Shining Legends", series: "Sun & Moon", printedTotal: 73, total: 78, releaseDate: "2017/10/06", images: { symbol: "", logo: "" } },
  },
  {
    id: "swsh35-44",
    name: "Pikachu VMAX",
    supertype: "Pokémon",
    number: "44",
    rarity: "Rare VMAX",
    images: { small: "https://images.pokemontcg.io/swsh35/44.png", large: "https://images.pokemontcg.io/swsh35/44_hires.png" },
    set: { id: "swsh35", name: "Champion's Path", series: "Sword & Shield", printedTotal: 73, total: 80, releaseDate: "2020/09/25", images: { symbol: "", logo: "" } },
  },
  {
    id: "swsh12pt5-160",
    name: "Lugia V",
    supertype: "Pokémon",
    number: "160",
    rarity: "Rare Ultra",
    images: { small: "https://images.pokemontcg.io/swsh12pt5/160.png", large: "https://images.pokemontcg.io/swsh12pt5/160_hires.png" },
    set: { id: "swsh12pt5", name: "Crown Zenith", series: "Sword & Shield", printedTotal: 159, total: 230, releaseDate: "2023/01/20", images: { symbol: "", logo: "" } },
  },
  {
    id: "swsh9-166",
    name: "Arceus VSTAR",
    supertype: "Pokémon",
    number: "166",
    rarity: "Rare Secret",
    images: { small: "https://images.pokemontcg.io/swsh9/166.png", large: "https://images.pokemontcg.io/swsh9/166_hires.png" },
    set: { id: "swsh9", name: "Brilliant Stars", series: "Sword & Shield", printedTotal: 172, total: 186, releaseDate: "2022/02/25", images: { symbol: "", logo: "" } },
  },
  {
    id: "swsh11-174",
    name: "Giratina VSTAR",
    supertype: "Pokémon",
    number: "174",
    rarity: "Rare Secret",
    images: { small: "https://images.pokemontcg.io/swsh11/174.png", large: "https://images.pokemontcg.io/swsh11/174_hires.png" },
    set: { id: "swsh11", name: "Lost Origin", series: "Sword & Shield", printedTotal: 196, total: 217, releaseDate: "2022/09/09", images: { symbol: "", logo: "" } },
  },
  {
    id: "sv3pt5-171",
    name: "Mew ex",
    supertype: "Pokémon",
    number: "171",
    rarity: "Rare Ultra",
    images: { small: "https://images.pokemontcg.io/sv3pt5/171.png", large: "https://images.pokemontcg.io/sv3pt5/171_hires.png" },
    set: { id: "sv3pt5", name: "151", series: "Scarlet & Violet", printedTotal: 165, total: 207, releaseDate: "2023/09/22", images: { symbol: "", logo: "" } },
  },
];

export function FeaturedListings({ cards }: FeaturedListingsProps) {
  const displayCards = cards.length > 0 ? cards : FALLBACK_CARDS;
  const ref = useReveal();

  return (
    <section ref={ref} className="py-24 bg-gray-50 reveal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Trending <span className="text-red-600">Cards</span>
            </h2>
            <p className="mt-2 text-gray-500">
              Real-time data from the Pokémon TCG market
            </p>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayCards.slice(0, 8).map((card) => (
            <div key={card.id}>
              <Link
                href={`/card/${card.id}`}
                className="group block rounded-xl bg-white border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Card Image */}
                <div className="relative aspect-[2.5/3.5] bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                  {card.images?.small ? (
                    <Image
                      src={card.images.small}
                      alt={card.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}

                  {/* Grade badge */}
                  {card.rarity && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white uppercase tracking-wider">
                      {card.rarity.includes("Rare") ? "RARE" : card.rarity.slice(0, 6)}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {card.set?.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      {card.cardmarket?.prices?.averageSellPrice
                        ? `$${(card.cardmarket.prices.averageSellPrice as number).toFixed(2)}`
                        : card.tcgplayer?.prices?.holofoil?.market
                          ? `$${card.tcgplayer.prices.holofoil.market.toFixed(2)}`
                          : "—"}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      NM
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All Listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
