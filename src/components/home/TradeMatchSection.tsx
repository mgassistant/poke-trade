"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Search, Handshake, ShieldCheck } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: <Search className="h-6 w-6" />,
    title: "Find Cards You Want",
    description:
      "Browse thousands of listings or let our matching engine find cards on your want list automatically.",
  },
  {
    step: "02",
    icon: <Handshake className="h-6 w-6" />,
    title: "Make an Offer",
    description:
      "Propose a trade, negotiate fair value, or buy outright. Our pricing engine ensures both sides get a great deal.",
  },
  {
    step: "03",
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Trade with Confidence",
    description:
      "Ship with tracking, verify on arrival, and earn reputation. Every trade is protected by our Trust system.",
  },
];

export const TradeMatchSection = memo(function TradeMatchSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-red-600 uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Start Trading in <span className="text-red-600">Three Steps</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            No forums, no DMs, no risk. Our platform handles everything from
            discovery to delivery.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-y-1/2" />

          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className="glass-card rounded-xl p-8 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                {/* Step number */}
                <span className="absolute top-6 right-6 text-5xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors">
                  {item.step}
                </span>

                <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-6 text-red-600 group-hover:bg-red-100 transition-colors">
                  {item.icon}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
