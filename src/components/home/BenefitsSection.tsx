"use client";

import { motion } from "framer-motion";
import { TrendingUp, Repeat, Shield, BarChart3, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Lowest Fees",
    description: "3-5% marketplace fee vs 12-15% elsewhere. Keep more money in your collection.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: <Repeat className="h-5 w-5" />,
    title: "Trade-First Platform",
    description: "Built for trading, not just selling. Smart matching finds mutual swaps instantly.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Trusted & Verified",
    description: "Reputation system, verified traders, buyer protection, and dispute resolution.",
    color: "text-success bg-success/10",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Live Market Data",
    description: "Real-time pricing from TCGPlayer. Track collection value, spot trends, and invest smart.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Collector Community",
    description: "Share pulls, showcase collections, follow traders, and connect with fellow collectors.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Lightning Fast",
    description: "Modern tech stack built for speed. Search, list, trade, and track in seconds.",
    color: "text-warning bg-warning/10",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 bg-card/20 border-t border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">
            Why Collectors Choose <span className="text-primary">Poké-Trade</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Everything you need to trade, sell, and grow your Pokémon card collection — in one place.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${benefit.color}`}>
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
