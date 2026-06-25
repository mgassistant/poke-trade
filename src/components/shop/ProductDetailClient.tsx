"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "./PriceDisplay";
import { ProductBadge } from "./ProductBadge";
import { AddToCartButton } from "./AddToCartButton";
import { DropCountdown } from "./DropCountdown";
import { CartButton } from "./CartButton";
import { ProductCard } from "./ProductCard";
import {
  ArrowLeft, Package, CheckCircle, ShieldCheck,
  Users, Clock, Loader2,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  condition: string | null;
  product_type: string | null;
  source_type: string | null;
  status: string;
  images: string[];
  msrp_price: number | null;
  market_price: number | null;
  member_price: number | null;
  premium_member_price: number | null;
  public_price: number | null;
  inventory_count: number;
  reserved_count: number;
  max_qty_per_member: number;
  max_qty_per_household: number;
  requires_membership: boolean;
  premium_only: boolean;
  early_access_enabled: boolean;
  drop_start_at: string | null;
  verification_status: string;
}

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/shop/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);

          // Fetch related products
          if (data.product?.category) {
            const relRes = await fetch(
              `/api/shop/products?category=${data.product.category}&limit=4`
            );
            if (relRes.ok) {
              const relData = await relRes.json();
              setRelated(
                (relData.products ?? []).filter(
                  (p: Product) => p.slug !== slug
                ).slice(0, 4)
              );
            }
          }
        }
      } catch {
        // Silent
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">This product may have been removed or archived.</p>
        <Button asChild>
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const available = product.inventory_count - product.reserved_count;
  const isScheduled = product.status === "scheduled";

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden relative">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage] || images[0]}
                  alt={product.title}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 rounded-lg border overflow-hidden relative ${
                      selectedImage === i
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.premium_only && <ProductBadge type="premium_only" />}
              {product.requires_membership && !product.premium_only && (
                <ProductBadge type="member_exclusive" />
              )}
              {product.early_access_enabled && <ProductBadge type="early_access" />}
              {product.source_type === "personal_collection" && (
                <ProductBadge type="personal_collection" />
              )}
              {isScheduled && <ProductBadge type="limited_drop" />}
              {product.verification_status === "verified" && (
                <ProductBadge type="verified" />
              )}
            </div>

            {/* Title & Meta */}
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                {product.category.replace("_", " ")}
                {product.product_type && ` · ${product.product_type}`}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              {product.condition && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  {product.condition}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <PriceDisplay
                msrpPrice={product.msrp_price}
                marketPrice={product.market_price}
                memberPrice={product.member_price}
                premiumMemberPrice={product.premium_member_price}
                publicPrice={product.public_price}
              />
            </div>

            {/* Drop Countdown */}
            {isScheduled && product.drop_start_at && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <DropCountdown targetDate={product.drop_start_at} label="Drop starts in" />
              </div>
            )}

            {/* Stock & Limits */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {product.status !== "sold_out" && (
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span>
                    {available > 0 ? `${available} available` : "Out of stock"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Limit {product.max_qty_per_member} per member</span>
              </div>
              {product.early_access_enabled && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{product.early_access_minutes || 30}min early access</span>
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <AddToCartButton product={product} className="w-full h-12 text-base" />

            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Verified Authentic</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>Anti-Scalper Protected</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              More in {product.category.replace("_", " ")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CartButton />
    </div>
  );
}
