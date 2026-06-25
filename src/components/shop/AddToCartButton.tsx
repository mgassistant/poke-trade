"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Lock, Bell, Check } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  status: string;
  requires_membership: boolean;
  premium_only: boolean;
  inventory_count: number;
  reserved_count: number;
  drop_start_at: string | null;
}

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  onSuccess?: () => void;
}

export function AddToCartButton({ product, className = "", onSuccess }: AddToCartButtonProps) {
  const { user, profile, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = product.inventory_count - product.reserved_count;
  const isSoldOut = product.status === "sold_out" || available <= 0;
  const isScheduled = product.status === "scheduled";
  const needsMembership = product.requires_membership && profile?.subscription_tier === "free";
  const needsPremium = product.premium_only && !profile?.is_premium;

  if (userLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (isSoldOut) {
    return (
      <Button
        variant="outline"
        className={`border-gray-300 text-gray-500 ${className}`}
        onClick={async () => {
          if (!user) {
            router.push("/login");
            return;
          }
          setLoading(true);
          try {
            await fetch("/api/shop/waitlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ product_id: product.id }),
            });
            setAdded(true);
          } catch {
            setError("Failed to join waitlist");
          }
          setLoading(false);
        }}
      >
        {added ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            On Waitlist
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Join Waitlist
          </>
        )}
      </Button>
    );
  }

  if (isScheduled) {
    return (
      <Button disabled variant="outline" className={`border-red-200 text-red-400 ${className}`}>
        <Lock className="h-4 w-4 mr-2" />
        Coming Soon
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        className={`bg-red-600 hover:bg-red-700 text-white ${className}`}
        onClick={() => router.push("/login")}
      >
        <Lock className="h-4 w-4 mr-2" />
        Sign In to Purchase
      </Button>
    );
  }

  if (needsPremium) {
    return (
      <Button
        className={`bg-amber-500 hover:bg-amber-600 text-white ${className}`}
        onClick={() => router.push("/membership")}
      >
        <Lock className="h-4 w-4 mr-2" />
        Premium Members Only
      </Button>
    );
  }

  if (needsMembership) {
    return (
      <Button
        className={`bg-purple-600 hover:bg-purple-700 text-white ${className}`}
        onClick={() => router.push("/membership")}
      >
        <Lock className="h-4 w-4 mr-2" />
        Join to Unlock
      </Button>
    );
  }

  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add to cart");
        return;
      }
      setAdded(true);
      onSuccess?.();
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        className={`bg-red-600 hover:bg-red-700 text-white ${className}`}
        onClick={handleAddToCart}
        disabled={loading || added}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : added ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        {loading ? "Adding..." : added ? "Added!" : "Add to Cart"}
      </Button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
