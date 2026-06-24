"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Check } from "lucide-react";

export const CollectionSection = memo(function CollectionSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-gray-500">Total Collection Value</span>
                    <div className="text-4xl font-bold text-gray-900 mt-1">$24,650</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    +12.4%
                  </span>
                </div>

                {/* Chart */}
                <div className="h-32 bg-gray-50 rounded-xl flex items-end justify-around p-4 gap-1 border border-gray-100">
                  {[35, 42, 38, 55, 48, 62, 58, 72, 68, 78, 82, 90].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.04 }}
                      className="bg-gradient-to-t from-red-500 to-red-400 rounded-t w-full"
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Cards", value: "847" },
                    { label: "Graded", value: "42" },
                    { label: "Sets", value: "23" },
                    { label: "For Trade", value: "156" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="font-bold text-lg text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Top cards */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Most Valuable
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Charizard VMAX Alt Art", value: "$420", change: "+8%" },
                      { name: "Umbreon VMAX Alt Art", value: "$320", change: "+15%" },
                      { name: "Pikachu VMAX Rainbow", value: "$185", change: "+3%" },
                    ].map((card) => (
                      <div
                        key={card.name}
                        className="flex items-center justify-between text-sm p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <span className="text-gray-600">{card.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{card.value}</span>
                          <span className="text-emerald-600 text-xs">{card.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-3">
              Portfolio Tracker
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900">
              Track Your{" "}
              <span className="text-red-600">Collection</span>
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Monitor your portfolio with real-time market pricing. Track ROI,
              spot trends, and never miss a value spike on your most valuable
              cards.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Real-time TCGPlayer market pricing",
                "Portfolio performance & growth charts",
                "Graded slabs & raw card tracking",
                "Set completion progress bars",
                "Purchase price & ROI analytics",
                "Export collection data anytime",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-600/20 text-sm"
            >
              Start Tracking Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
