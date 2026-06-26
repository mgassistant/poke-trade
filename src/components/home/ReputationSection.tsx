"use client";

import { memo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { TRADER_LEVELS } from "@/lib/constants";

const tierColors = [
  "border-gray-300 text-gray-500",
  "border-blue-300 text-blue-600",
  "border-purple-300 text-purple-600",
  "border-amber-300 text-amber-600",
  "border-red-300 text-red-600",
  "border-yellow-400 text-yellow-600",
];

export const ReputationSection = memo(function ReputationSection() {
  const ref = useReveal();

  return (
    <section ref={ref} className="py-24 bg-white reveal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-yellow-600 uppercase tracking-wider mb-3">
            Trusted Trader Program
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Build Your <span className="text-blue-600">Reputation</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Earn badges, unlock perks, and rise through the ranks with every
            successful trade.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRADER_LEVELS.map((level, i) => (
            <div key={level.name}>
              <div
                className={`text-center h-full rounded-xl bg-white border ${tierColors[i] || "border-gray-200"} p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-sm`}
              >
                <div className="text-4xl mb-3">{level.icon}</div>
                <h3 className="font-semibold text-sm text-gray-900">{level.name}</h3>
                <p className="text-xs text-gray-500 mt-1.5">
                  {level.minTrades}+ trades
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress visualization */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">Your Progress</span>
              <span className="text-gray-900 font-medium">Rookie → Pokémon Trainer</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: "40%" }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">2 of 5 trades completed</p>
          </div>
        </div>

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
});
