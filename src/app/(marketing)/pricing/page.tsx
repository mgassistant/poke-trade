"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export default function PricingPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            Simple Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Start Free. <span className="text-primary">Upgrade Anytime.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {SUBSCRIPTION_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
            >
              <Card
                className={`h-full relative ${
                  tier.id === "pro"
                    ? "border-red-300 shadow-lg ring-1 ring-red-100 scale-[1.03]"
                    : ""
                }`}
              >
                {tier.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-4">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-10 pb-8">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-bold">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tier.price === 0 ? "No credit card required" : "Cancel anytime"}
                  </p>
                  <ul className="mt-8 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
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
                      {tier.price === 0 ? "Get Started Free" : `Start ${tier.id === "pro" ? "Pro" : "Elite"} Trial`}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <div className="space-y-6">
            {[
              { q: "What are the marketplace fees?", a: "Free users pay a 5% fee on marketplace sales. Pro and Elite members pay only 3%. These are among the lowest in the industry — most platforms charge 10-15%." },
              { q: "Can I trade without a paid plan?", a: "Absolutely! Trading is free for everyone. Free users get basic trade matching. Pro and Elite unlock advanced matching with more trade opportunities." },
              { q: "Is there a limit on collection tracking?", a: "Free users can track unlimited cards in their collection. Pro and Elite unlock portfolio analytics, value charts, and investment tracking." },
              { q: "How do payments work for marketplace sales?", a: "We use Stripe for secure payments. Sellers connect their Stripe account to receive payouts directly. Buyers pay with credit/debit card." },
              { q: "Can I cancel my subscription?", a: "Yes, cancel anytime from your account settings. You'll keep your subscription benefits until the end of your billing period." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
