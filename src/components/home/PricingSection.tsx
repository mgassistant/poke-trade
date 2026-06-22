"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export function PricingSection() {
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
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            Premium Plans
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Upgrade Your Trading <span className="text-secondary">Game</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SUBSCRIPTION_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
            >
              <Card
                className={`h-full relative ${
                  tier.id === "pro"
                    ? "border-primary/50 glow-blue scale-[1.03]"
                    : "hover:border-border"
                }`}
              >
                {tier.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-4">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-muted-foreground">/month</span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-8"
                    variant={tier.id === "pro" ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link href="/register">
                      {tier.price === 0 ? "Get Started Free" : "Start Pro Trial"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
