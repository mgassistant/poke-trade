"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Gem, Users, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-24 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#131c33] to-[#1e293b]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />

      {/* Sparkle dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + i * 15}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text content (60%) */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-10"
              >
                <Image
                  src="/logo.png"
                  alt="Poké-Trade"
                  width={280}
                  height={84}
                  className="h-16 sm:h-20 w-auto"
                  priority
                />
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
                The Better Way
                <br />
                <span className="text-white">to Trade.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed">
                Join a community of collectors. Trade securely. Buy, sell, and
                grow your collection.
              </p>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                {[
                  { icon: <Shield className="h-4 w-4 text-blue-400" />, label: "Secure Trades" },
                  { icon: <Gem className="h-4 w-4 text-blue-400" />, label: "Fair Prices" },
                  { icon: <Users className="h-4 w-4 text-blue-400" />, label: "Trusted Community" },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300"
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-600/25 text-base"
                >
                  Start Trading
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/20 text-white hover:bg-white/5 font-semibold rounded-lg transition-all duration-200 text-base"
                >
                  Create Free Account
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT: Hero image placeholder (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2 relative"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              {/* Glow behind image */}
              <div className="absolute -inset-4 bg-gradient-to-br from-red-600/20 via-transparent to-blue-500/20 rounded-3xl blur-2xl" />

              {/* Image container */}
              <div className="relative h-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-800 via-slate-800/80 to-slate-900">
                {/* Placeholder content — card collage feel */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a2744] to-[#0f172a]" />

                {/* Decorative card shapes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-3 p-6 transform rotate-3">
                    {[
                      "from-yellow-500/30 to-amber-600/20",
                      "from-blue-500/30 to-indigo-600/20",
                      "from-red-500/30 to-rose-600/20",
                      "from-purple-500/30 to-violet-600/20",
                    ].map((gradient, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className={`aspect-[2.5/3.5] rounded-xl bg-gradient-to-br ${gradient} border border-white/10 shadow-xl`}
                      />
                    ))}
                  </div>
                </div>

                {/* Overlay text */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white/80 text-sm font-medium">Trade with confidence</p>
                  <p className="text-white/50 text-xs mt-1">Verified collectors · Secure transactions</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 pt-10 border-t border-white/5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: "19,000+", label: "Cards Listed" },
              { value: "Verified", label: "Trusted Traders" },
              { value: "3%", label: "Low Fees" },
              { value: "Secure", label: "Every Trade" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
