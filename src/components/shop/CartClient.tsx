"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Trash2, ArrowLeft, Loader2, Package,
  Lock, ShieldCheck,
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: string[];
    member_price: number | null;
    public_price: number | null;
    market_price: number | null;
    inventory_count: number;
    reserved_count: number;
    max_qty_per_member: number;
    condition: string | null;
  };
}

export function CartClient() {
  const { user, profile, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canceled = searchParams.get("canceled");

  const isMember = profile?.subscription_tier !== "free";
  const isPremium = profile?.is_premium ?? false;

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchCart();
  }, [user, userLoading]);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/shop/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {
      // Silent
    }
    setLoading(false);
  };

  const removeItem = async (productId: string) => {
    try {
      await fetch("/api/shop/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      setItems((prev) => prev.filter((i) => i.product?.id !== productId));
    } catch {
      // Silent
    }
  };

  const getItemPrice = (item: CartItem): number => {
    const p = item.product;
    if (isPremium && p.member_price) return p.member_price;
    if (isMember && p.member_price) return p.member_price;
    return p.public_price ?? p.market_price ?? 0;
  };

  const subtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );
  const taxEstimate = subtotal * 0.0875; // ~8.75% CA tax estimate
  const total = subtotal + taxEstimate;

  const handleCheckout = async () => {
    setCheckingOut(true);
    setError(null);
    // Navigate to embedded checkout page (Stripe Embedded Checkout)
    window.location.href = "/shop/checkout";
    return;
    // Legacy Stripe hosted checkout (kept for reference)
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setCheckingOut(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-lg text-center px-4">
          <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-500 mb-6">Sign in to view your cart and checkout.</p>
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart</h1>

        {canceled && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm mb-6">
            Checkout was canceled. Your items are still in your cart.
          </div>
        )}

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h2>
            <p className="text-gray-500 mb-6">Browse our shop to find amazing deals.</p>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/shop">Shop Now</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                if (!product) return null;
                const images = Array.isArray(product.images) ? product.images : [];
                const price = getItemPrice(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4"
                  >
                    <div className="h-20 w-20 bg-gray-50 rounded-lg relative overflow-hidden flex-shrink-0">
                      {images[0] ? (
                        <Image
                          src={images[0]}
                          alt={product.title}
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="font-medium text-gray-900 text-sm hover:text-red-600 transition-colors line-clamp-2"
                      >
                        {product.title}
                      </Link>
                      {product.condition && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.condition}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900">
                          ${price.toFixed(2)}
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-400 font-normal ml-1">
                              × {item.quantity}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax (est.)</span>
                    <span className="text-gray-600">${taxEstimate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-green-600 font-medium">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Estimated Total</span>
                    <span className="font-bold text-gray-900 text-lg">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs mt-4">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white h-11"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure checkout via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
