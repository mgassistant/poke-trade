"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export function PricingSection() {
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
            Premium Plans
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Upgrade Your Trading{" "}
            <span className="text-red-500">Game</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SUBSCRIPTION_TIERS.map((tier, i) => {
            const isPopular = tier.id === "pro";
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className={isPopular ? "md:-mt-4 md:mb-0" : ""}
              >
                <div
                  className={`h-full relative rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                    isPopular
                      ? "bg-white/[0.08] border-2 border-red-500/40 shadow-xl shadow-red-500/5"
                      : "glass-card hover:bg-white/[0.07]"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-yellow-500 text-yellow-950 text-xs font-bold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-slate-500">/month</span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-slate-300"
                      >
                        <div className="h-4 w-4 rounded-full bg-red-600/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5 text-red-400" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      isPopular
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                        : "border border-white/10 text-white hover:bg-white/5"
                    }`}
                  >
                    {tier.price === 0 ? "Get Started Free" : "Start Pro Trial"}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/membership"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Compare All Plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
