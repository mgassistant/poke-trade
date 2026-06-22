"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[200px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
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
              className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto mx-auto drop-shadow-[0_0_40px_rgba(0,212,255,0.3)]"
              priority
            />
          </motion.div>

          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            The #1 Pokémon Card Trading Platform
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-foreground">Trade. Buy. Sell.</span>
            <br />
            <span
              className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              Collect.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The safest, smartest Pokémon card marketplace.
            Smart trade matching, real-time pricing, and fees as low as <span className="text-primary font-semibold">3%</span>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" variant="gradient" className="text-base px-10" asChild>
              <Link href="/register">
                Start Trading Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="text-base" asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
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
                <div className="text-2xl sm:text-3xl font-bold text-primary glow-text-blue">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
