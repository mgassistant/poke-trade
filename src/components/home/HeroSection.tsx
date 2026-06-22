"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient — Pokémon brand red to blue */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-blue-700" />
        {/* Subtle Poké Ball pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.3) 32%, transparent 32%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 12%, transparent 12%)`,
            backgroundSize: "120px 120px",
          }}
        />
        {/* Soft overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Image
              src="/logo.png"
              alt="Poké-Trade"
              width={600}
              height={180}
              className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto mx-auto drop-shadow-lg"
              priority
            />
          </motion.div>

          <Badge className="mb-6 px-4 py-1.5 text-sm bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            The Premier Pokémon Card Trading Platform
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white">
            Trade. Buy. Sell.
            <br />
            <span className="text-yellow-300">Collect.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            The safest, smartest Pokémon card marketplace.
            Trusted trading, verified cards, and fees as low as <span className="text-yellow-300 font-semibold">3%</span>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" className="text-base px-10 bg-white text-red-600 hover:bg-gray-100 font-semibold shadow-lg" asChild>
              <Link href="/register">
                Start Trading
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="text-base border-white/40 text-white hover:bg-white/10 hover:text-white" asChild>
              <Link href="/marketplace">Browse Cards</Link>
            </Button>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto"
          >
            {[
              { label: "Cards in Database", value: "100K+" },
              { label: "Active Traders", value: "2,500+" },
              { label: "Trades Completed", value: "12K+" },
              { label: "Marketplace Fee", value: "3-5%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/70 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
