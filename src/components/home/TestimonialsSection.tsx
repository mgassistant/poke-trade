"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex K.",
    role: "Pokémon Master · 250+ Trades",
    review:
      "Finally a platform built for trading, not just selling. Found 15 trade matches in my first week. The matching engine is insanely good.",
    rating: 5,
    avatar: "🔥",
  },
  {
    name: "Sarah M.",
    role: "Elite Collector · $50K+ Collection",
    review:
      "The collection tracker alone is worth it. I can see my portfolio value grow in real-time with TCGPlayer pricing. Way better than spreadsheets.",
    rating: 5,
    avatar: "💎",
  },
  {
    name: "James R.",
    role: "Pro Trader · 100+ Sales",
    review:
      "3% fees vs 13% on eBay? No brainer. Plus the reputation system weeds out bad actors. Haven't had a single issue in 6 months.",
    rating: 5,
    avatar: "⚡",
  },
];

const TestimonialCard = memo(function TestimonialCard({
  t,
  i,
}: {
  t: (typeof testimonials)[number];
  i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.1 }}
    >
      <div className="glass-card rounded-xl p-6 h-full hover:shadow-lg transition-all duration-300">
        {/* Stars */}
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: t.rating }).map((_, j) => (
            <Star
              key={j}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          &ldquo;{t.review}&rdquo;
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg">
            {t.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {t.name}
            </div>
            <div className="text-xs text-gray-500">{t.role}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export const TestimonialsSection = memo(function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Trusted by <span className="text-red-600">Collectors</span>
          </h2>
          <p className="mt-4 text-gray-500">
            Hear from real traders on the platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
});
