"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Gem, Users, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-24 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-red-50/30" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-red-100/40 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />

      {/* Sparkle dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-red-400 rounded-full animate-sparkle"
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

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-gray-900">
                The Better Way
                <br />
                <span className="text-red-600">to Trade.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed">
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
                  { icon: <Shield className="h-4 w-4 text-blue-600" />, label: "Secure Trades" },
                  { icon: <Gem className="h-4 w-4 text-blue-600" />, label: "Fair Prices" },
                  { icon: <Users className="h-4 w-4 text-blue-600" />, label: "Trusted Community" },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm"
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
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200 text-base"
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
              <div className="absolute -inset-4 bg-gradient-to-br from-red-200/40 via-transparent to-blue-200/30 rounded-3xl blur-2xl" />

              {/* Image container */}
              <div className="relative h-full rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-xl">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-blue-50" />

                {/* Decorative card shapes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-3 p-6 transform rotate-3">
                    {[
                      "from-yellow-400/40 to-amber-500/30",
                      "from-blue-400/40 to-indigo-500/30",
                      "from-red-400/40 to-rose-500/30",
                      "from-purple-400/40 to-violet-500/30",
                    ].map((gradient, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className={`aspect-[2.5/3.5] rounded-xl bg-gradient-to-br ${gradient} border border-white/60 shadow-lg`}
                      />
                    ))}
                  </div>
                </div>

                {/* Overlay text */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white/90 to-transparent">
                  <p className="text-gray-700 text-sm font-medium">Trade with confidence</p>
                  <p className="text-gray-500 text-xs mt-1">Verified collectors · Secure transactions</p>
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
          className="mt-20 pt-10 border-t border-gray-200"
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
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
