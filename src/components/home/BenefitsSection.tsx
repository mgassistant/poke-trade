"use client";

import { motion } from "framer-motion";
import { Shield, UserCheck, Lock, AlertTriangle, BarChart3, FileCheck } from "lucide-react";

const benefits = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Trust Score System",
    description:
      "Every trader earns a reputation score. See ratings, trade history, and verification status before you trade.",
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: "Identity Verification",
    description:
      "Verified traders go through ID checks. Know who you're trading with — no anonymous accounts.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Trade Protection",
    description:
      "Secure payment holds, shipping verification, and dispute resolution protect every transaction.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Fraud Prevention",
    description:
      "AI-powered fraud detection, counterfeit screening, and community reporting keep the platform safe.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Collection Tracker",
    description:
      "Track your entire collection with real-time market pricing, portfolio analytics, and set completion.",
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    title: "Insurance Referral",
    description:
      "Protect high-value collections with insurance referrals through our licensed partner network.",
  },
];

export function BenefitsSection() {
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Why <span className="text-red-500">Poké-Trade</span>?
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Built from the ground up for security, transparency, and the
            collector community.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="glass-card rounded-xl p-6 h-full hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1 group">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-blue-400 group-hover:text-blue-300 group-hover:border-blue-500/30 transition-all">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-base text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
