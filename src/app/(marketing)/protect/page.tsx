"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Check, Lock, FileCheck, Scale, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ProtectPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-success/10 text-success border-success/20">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Poké-Trade Protect
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Trade </span>
            <span className="text-success">Protection</span>
            <br />
            <span className="text-foreground">You Can Trust</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Protect your trades with payment authorization holds, tracking verification, and platform dispute review.
            All items ship directly between users — Poké-Trade never takes possession of your cards.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" className="bg-success hover:bg-success/90 text-white shadow-sm" asChild>
              <Link href="/register">
                Start Trading Safely
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/membership">View Membership Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How Trade Protection Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            How Trade <span className="text-success">Protection</span> Works
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Direct shipping between users with platform safeguards at every step.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <CreditCard className="h-6 w-6" />, title: "Payment Authorization", desc: "Secure payment holds protect both parties. Funds are authorized but not captured until trade completes.", stat: "Secure", statLabel: "payment holds" },
              { icon: <Truck className="h-6 w-6" />, title: "Direct Shipping", desc: "Ship directly to your trade partner. Required tracking and photo proof for every protected trade.", stat: "Direct", statLabel: "between users" },
              { icon: <FileCheck className="h-6 w-6" />, title: "Tracking Verification", desc: "Valid tracking numbers required. Delivery confirmation triggers trade completion.", stat: "Required", statLabel: "for all trades" },
              { icon: <Scale className="h-6 w-6" />, title: "Dispute Resolution", desc: "Submit disputes with evidence through our portal. Platform review for qualifying trades.", stat: "Fair", statLabel: "dispute review" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:border-success/30 transition-all hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-2xl font-bold text-success">{item.stat}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.statLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Protection Tiers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Protection <span className="text-primary">Tiers</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Higher membership = more protection benefits
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$5.99 or 5%",
                priceNote: "whichever is higher, split 50/50",
                features: [
                  "Direct shipping between users",
                  "Required photo proof",
                  "Required tracking numbers",
                  "Basic dispute support",
                  "No platform protection benefit",
                ],
                highlight: false,
              },
              {
                name: "Pro",
                price: "$3.99 or 3%",
                priceNote: "whichever is higher, split 50/50",
                features: [
                  "Everything in Free",
                  "Up to $50 discretionary platform credit",
                  "Priority dispute review (2-3 days)",
                  "Secure payment authorization hold",
                  "Enhanced evidence review",
                ],
                highlight: true,
              },
              {
                name: "Elite",
                price: "$3.99 or 3%",
                priceNote: "whichever is higher, split 50/50",
                features: [
                  "Everything in Pro",
                  "Up to $100 discretionary platform credit",
                  "Priority dispute review (1-2 days)",
                  "Dedicated support representative",
                  "Secure payment authorization hold",
                ],
                highlight: false,
              },
            ].map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card className={`h-full relative ${
                  tier.highlight ? "border-success/50 shadow-sm" : ""
                }`}>
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-4 bg-success text-white border-success">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="pt-10 pb-8">
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{tier.price}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{tier.priceNote}</p>
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <div className="h-4 w-4 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-2.5 w-2.5 text-success" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-8 ${
                        tier.highlight
                          ? "bg-success hover:bg-success/90 text-white"
                          : ""
                      }`}
                      variant={tier.highlight ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            How It <span className="text-success">Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: <Shield className="h-6 w-6" />, title: "Select Protection", desc: "Choose Trade Protection when creating your trade. Accept the terms and pay the protection fee." },
              { step: "2", icon: <Truck className="h-6 w-6" />, title: "Ship Directly", desc: "Ship your cards directly to your trade partner with required tracking and photo proof." },
              { step: "3", icon: <FileCheck className="h-6 w-6" />, title: "Confirm Receipt", desc: "Both parties confirm receipt. Payment authorizations are managed based on trade completion." },
              { step: "4", icon: <Scale className="h-6 w-6" />, title: "Dispute if Needed", desc: "If something goes wrong, submit a dispute with evidence for platform review." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="h-14 w-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
                      {item.icon}
                    </div>
                    <div className="text-xs text-success font-bold mb-2">STEP {item.step}</div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium">ℹ️ Important:</span> Poké-Trade is an online marketplace and does not buy, sell, inspect, authenticate, grade, store, ship, or take possession of any traded items. All items are shipped directly between users. Trade Protection is an optional platform benefit, not insurance. Benefits are discretionary, subject to review, and limited to applicable membership maximums. For collection insurance, we recommend consulting a licensed insurance professional.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Trade with <span className="text-success">Confidence</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Add Trade Protection to your next trade for payment authorization, tracking verification, and dispute support.
          </p>
          <Button size="xl" className="bg-success hover:bg-success/90 text-white" asChild>
            <Link href="/register">
              Start Trading
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
