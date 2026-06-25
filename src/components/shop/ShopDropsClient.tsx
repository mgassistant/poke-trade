"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropCountdown } from "./DropCountdown";
import { CartButton } from "./CartButton";
import {
  ArrowLeft, Calendar, Loader2, Zap, Clock, Package,
} from "lucide-react";

interface ScheduledProduct {
  title: string;
  slug: string;
  description: string | null;
  drop_start_at: string;
  member_price: number | null;
  market_price: number | null;
  public_price: number | null;
  inventory_count: number;
  images: string[];
  early_access_enabled: boolean;
  early_access_minutes: number;
}

interface DropEvent {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  premium_access_starts_at: string | null;
}

export function ShopDropsClient() {
  const [scheduledProducts, setScheduledProducts] = useState<ScheduledProduct[]>([]);
  const [drops, setDrops] = useState<DropEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/shop/drops");
        if (res.ok) {
          const data = await res.json();
          setScheduledProducts(data.scheduledProducts ?? []);
          setDrops(data.drops ?? []);
        }
      } catch {
        // Silent
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const liveDrops = drops.filter((d) => d.status === "live");
  const upcomingDrops = drops.filter((d) => d.status === "upcoming");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Calendar className="h-6 w-6 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Drop Calendar</h1>
        </div>

        {/* Live Drops */}
        {liveDrops.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">Live Now</h2>
            </div>
            <div className="space-y-4">
              {liveDrops.map((drop) => (
                <div
                  key={drop.id}
                  className="bg-green-50 border border-green-200 rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-600 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{drop.title}</h3>
                  {drop.description && (
                    <p className="text-sm text-gray-600">{drop.description}</p>
                  )}
                  <Button
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    asChild
                  >
                    <Link href="/shop#products">Shop Now</Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Drops */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Upcoming</h2>
          </div>

          {scheduledProducts.length === 0 && upcomingDrops.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No drops scheduled right now.</p>
              <p className="text-xs text-gray-400">Check back soon or become a member for early notifications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingDrops.map((drop) => (
                <div
                  key={drop.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{drop.title}</h3>
                  {drop.description && (
                    <p className="text-sm text-gray-600 mb-4">{drop.description}</p>
                  )}
                  <DropCountdown targetDate={drop.starts_at} />
                </div>
              ))}

              {scheduledProducts.map((product) => (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={`/shop/${product.slug}`}
                    className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{product.title}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-baseline gap-2">
                          {product.member_price && (
                            <span className="text-lg font-bold text-red-600">
                              ${product.member_price.toFixed(2)}
                            </span>
                          )}
                          {product.market_price && (
                            <span className="text-sm text-gray-400 line-through">
                              ${product.market_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{product.inventory_count} units</span>
                          {product.early_access_enabled && (
                            <span className="text-blue-500">
                              {product.early_access_minutes}min early access
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <DropCountdown
                          targetDate={product.drop_start_at}
                          compact
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
      <CartButton />
    </div>
  );
}
