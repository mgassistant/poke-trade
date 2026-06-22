"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardGrid } from "@/components/cards/CardGrid";
import { motion } from "framer-motion";
import type { TCGCard } from "@/lib/pokemon-tcg";

interface FeaturedListingsProps {
  cards: TCGCard[];
}

export function FeaturedListings({ cards }: FeaturedListingsProps) {
  if (cards.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Featured <span className="text-red-600">Cards</span>
            </h2>
            <p className="mt-2 text-gray-500">
              Real-time data from the Pokémon TCG market
            </p>
          </div>
          <Button variant="outline" className="hidden sm:flex" asChild>
            <Link href="/marketplace">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </motion.div>

        <CardGrid cards={cards.slice(0, 8)} variant="marketplace" />

        <div className="mt-10 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              View All Listings
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
