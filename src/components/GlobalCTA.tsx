"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const DISMISS_KEY = "poke-trade-cta-dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function GlobalCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check dismiss state
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DURATION_MS) {
      return;
    }

    // Check auth state
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) setVisible(true);
    });
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4"
        >
          <div className="mx-auto max-w-4xl rounded-xl border border-white/20 bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-black/20 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <p className="text-sm font-medium text-white flex-1 text-center sm:text-left">
                <span className="mr-1.5">⚡</span>
                Join thousands of collectors on Poké-Trade
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25"
                  asChild
                >
                  <Link href="/register">Join Today</Link>
                </Button>
                <button
                  onClick={dismiss}
                  className="ml-1 p-1.5 rounded-md text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
