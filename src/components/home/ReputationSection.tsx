"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TRADER_LEVELS } from "@/lib/constants";

const tierColors = [
  "border-slate-600 text-slate-400",
  "border-blue-500/50 text-blue-400",
  "border-purple-500/50 text-purple-400",
  "border-amber-500/50 text-amber-400",
  "border-red-500/50 text-red-400",
  "border-yellow-400/50 text-yellow-300",
];

export function ReputationSection() {
  return (
    <section className="py-24 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-yellow-500 uppercase tracking-wider mb-3">
            Trusted Trader Program
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Build Your <span className="text-blue-400">Reputation</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Earn badges, unlock perks, and rise through the ranks with every
            successful trade.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRADER_LEVELS.map((level, i) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div
                className={`text-center h-full rounded-xl bg-white/[0.03] border ${tierColors[i] || "border-white/10"} p-5 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="text-4xl mb-3">{level.icon}</div>
                <h3 className="font-semibold text-sm text-white">{level.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  {level.minTrades}+ trades
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress visualization */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Your Progress</span>
              <span className="text-white font-medium">Rookie → Pokémon Trainer</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "40%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">2 of 5 trades completed</p>
          </div>
        </motion.div>

        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-600/20 text-sm"
          >
            Start Building Your Reputation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
