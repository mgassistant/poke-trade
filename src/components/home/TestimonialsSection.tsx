"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex K.",
    role: "Pokémon Master · 250+ Trades",
    review: "Finally a platform built for trading, not just selling. Found 15 trade matches in my first week. The matching engine is insanely good.",
    rating: 5,
    avatar: "🔥",
  },
  {
    name: "Sarah M.",
    role: "Elite Collector · $50K+ Collection",
    review: "The collection tracker alone is worth it. I can see my portfolio value grow in real-time with TCGPlayer pricing. Way better than spreadsheets.",
    rating: 5,
    avatar: "💎",
  },
  {
    name: "James R.",
    role: "Pro Trader · 100+ Sales",
    review: "3% fees vs 13% on eBay? No brainer. Plus the reputation system weeds out bad actors. Haven't had a single issue in 6 months.",
    rating: 5,
    avatar: "⚡",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">
            Trusted by <span className="text-primary">Collectors</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hear from real traders on the platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full hover:border-primary/20 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    &ldquo;{t.review}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
