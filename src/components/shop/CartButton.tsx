"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";

export function CartButton() {
  const { user } = useUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      try {
        const res = await fetch("/api/shop/cart");
        if (res.ok) {
          const data = await res.json();
          const total = (data.items ?? []).reduce(
            (sum: number, item: { quantity: number }) => sum + item.quantity,
            0
          );
          setCount(total);
        }
      } catch {
        // Silently fail
      }
    };

    fetchCart();
    const interval = setInterval(fetchCart, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || count === 0) return null;

  return (
    <Link href="/shop/cart">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40 bg-red-600 text-white rounded-full p-3.5 shadow-lg hover:bg-red-700 transition-colors cursor-pointer"
      >
        <ShoppingCart className="h-5 w-5" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-white text-red-600 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}
