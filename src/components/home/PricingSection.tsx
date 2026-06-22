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
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1.5 bg-yellow-50 text-yellow-700 border-yellow-200">
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            Premium Plans
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Upgrade Your Trading <span className="text-red-600">Game</span>
          </h2>
          <p className="mt-4 text-gray-500">
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
                    ? "border-red-300 shadow-lg scale-[1.03] ring-1 ring-red-100"
                    : "hover:border-gray-300"
                }`}
              >
                {tier.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-4 bg-yellow-400 text-yellow-900 border-yellow-500 font-semibold">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-gray-500">/month</span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <div className="h-4 w-4 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5 text-red-600" />
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
