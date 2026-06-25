"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { DropCountdown } from "./DropCountdown";
import { CartButton } from "./CartButton";
import {
  Zap, Shield, Users, CheckCircle,
  Package, Star, Crown, Gift, Wrench,
  Box, Sparkles, Lock, Layers,
} from "lucide-react";

const CATEGORIES = [
  { slug: "sealed", label: "Sealed", icon: Box, description: "Booster boxes & ETBs" },
  { slug: "singles", label: "Singles", icon: Star, description: "Individual cards" },
  { slug: "graded", label: "Graded", icon: CheckCircle, description: "PSA, BGS, CGC" },
  { slug: "mystery", label: "Mystery", icon: Gift, description: "Curated packs" },
  { slug: "accessories", label: "Accessories", icon: Wrench, description: "Sleeves & binders" },
  { slug: "supplies", label: "Supplies", icon: Layers, description: "Toploaders & storage" },
  { slug: "member_exclusive", label: "Exclusive", icon: Lock, description: "Members only" },
  { slug: "personal_collection", label: "Collection", icon: Sparkles, description: "Owner picks" },
];

const VALUE_PROPS = [
  { icon: Zap, title: "Limited Drops", desc: "Exclusive product releases at set times" },
  { icon: Shield, title: "Fair Pricing", desc: "Below market prices for members" },
  { icon: Users, title: "Anti-Scalper", desc: "Purchase limits protect real collectors" },
  { icon: CheckCircle, title: "Verified Inventory", desc: "Every product authenticated" },
];

interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  condition: string | null;
  status: string;
  images: string[];
  msrp_price: number | null;
  market_price: number | null;
  member_price: number | null;
  premium_member_price: number | null;
  public_price: number | null;
  inventory_count: number;
  reserved_count: number;
  requires_membership: boolean;
  premium_only: boolean;
  early_access_enabled: boolean;
  drop_start_at: string | null;
  source_type: string | null;
}

interface ScheduledProduct {
  title: string;
  slug: string;
  drop_start_at: string;
  member_price: number | null;
  market_price: number | null;
  images: string[];
}

export function ShopLanding() {
  const [products, setProducts] = useState<Product[]>([]);
  const [scheduledProducts, setScheduledProducts] = useState<ScheduledProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, dropRes] = await Promise.all([
          fetch("/api/shop/products?status=all"),
          fetch("/api/shop/drops"),
        ]);
        const prodData = await prodRes.json();
        const dropData = await dropRes.json();
        setProducts(prodData.products ?? []);
        setScheduledProducts(dropData.scheduledProducts ?? []);
      } catch {
        // Silent
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const activeProducts = products.filter((p) => p.status === "active");
  const filteredProducts = selectedCategory
    ? activeProducts.filter((p) => p.category === selectedCategory)
    : activeProducts;

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-red-50 pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 text-sm text-red-600 font-medium mb-6">
              <Zap className="h-4 w-4" />
              Now Open
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
              Poké Trade <span className="text-red-600">Shop</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Members get first access to limited TCG drops under market pricing.
              Anti-scalper protection for real collectors.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8"
                asChild
              >
                <Link href="#products">Shop Drops</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8"
                asChild
              >
                <Link href="/membership">Become a Member</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 bg-red-50 text-red-600 rounded-xl mb-3">
                  <prop.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{prop.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{prop.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.slug ? null : cat.slug
                  )
                }
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  selectedCategory === cat.slug
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <cat.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{cat.label}</span>
                <span className="text-[10px] text-gray-400">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Drops */}
      {scheduledProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <Crown className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Drops</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledProducts.map((product) => (
                <Link
                  key={product.slug}
                  href={`/shop/${product.slug}`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
                    {product.title}
                  </h3>
                  {product.member_price && product.market_price && (
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-lg font-bold text-red-600">
                        ${product.member_price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ${product.market_price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {product.drop_start_at && (
                    <DropCountdown targetDate={product.drop_start_at} />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section id="products" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedCategory
              ? `${CATEGORIES.find((c) => c.slug === selectedCategory)?.label ?? "Products"}`
              : "Featured Products"}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {selectedCategory
              ? `Showing ${filteredProducts.length} products`
              : `${activeProducts.length} products available`}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            All products are subject to availability. Prices may change without notice.
            Member pricing requires an active Poké-Trade Pro or Elite subscription.
            Purchase limits are enforced per account and per household to ensure fair access.
            All sales are final unless the item is not as described.
            Poké-Trade is not affiliated with The Pokémon Company, Nintendo, or Creatures Inc.
          </p>
        </div>
      </section>

      <CartButton />
    </div>
  );
}
