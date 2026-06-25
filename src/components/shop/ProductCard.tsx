"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProductBadge } from "./ProductBadge";
import { PriceDisplay } from "./PriceDisplay";
import { DropCountdown } from "./DropCountdown";
import { Package } from "lucide-react";

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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const available = product.inventory_count - product.reserved_count;
  const isSoldOut = product.status === "sold_out" || available <= 0;
  const isScheduled = product.status === "scheduled";
  const images = Array.isArray(product.images) ? product.images : [];
  const firstImage = images[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/shop/${product.slug}`}>
        <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200">
          {/* Image */}
          <div className="aspect-square relative bg-gray-50 overflow-hidden">
            {firstImage ? (
              <Image
                src={firstImage}
                alt={product.title}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}

            {/* Sold out overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-gray-900 font-bold px-4 py-1.5 rounded-full text-sm">
                  Sold Out
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {product.premium_only && <ProductBadge type="premium_only" />}
              {product.requires_membership && !product.premium_only && (
                <ProductBadge type="member_exclusive" />
              )}
              {product.early_access_enabled && <ProductBadge type="early_access" />}
              {product.source_type === "personal_collection" && (
                <ProductBadge type="personal_collection" />
              )}
              {isScheduled && <ProductBadge type="limited_drop" />}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              {product.category.replace("_", " ")}
              {product.condition && ` · ${product.condition}`}
            </div>

            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
              {product.title}
            </h3>

            {/* Price */}
            <PriceDisplay
              msrpPrice={product.msrp_price}
              marketPrice={product.market_price}
              memberPrice={product.member_price}
              publicPrice={product.public_price}
              compact
            />

            {/* Stock */}
            {!isSoldOut && !isScheduled && available <= 5 && (
              <p className="text-xs text-red-600 font-medium">
                Only {available} left!
              </p>
            )}

            {/* Countdown for scheduled drops */}
            {isScheduled && product.drop_start_at && (
              <DropCountdown targetDate={product.drop_start_at} compact />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
