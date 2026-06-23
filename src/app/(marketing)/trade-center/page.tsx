"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Repeat, ArrowRight, ArrowDown, Search, Users, Shield, TrendingUp,
  Package, Star, MessageSquare, FileCheck, Truck, CheckCircle2,
  Lock, Scale, Eye, History, AlertTriangle, Crown, Gavel, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TRADER_LEVELS } from "@/lib/constants";

const TRADE_STATUSES = [
  { status: "Draft", icon: "📝", color: "text-muted-foreground", desc: "Building your offer" },
  { status: "Pending", icon: "⏳", color: "text-warning", desc: "Waiting for response" },
  { status: "Countered", icon: "🔄", color: "text-secondary", desc: "Counter offer received" },
  { status: "Agreed", icon: "🤝", color: "text-success", desc: "Both parties agreed" },
  { status: "Awaiting Shipment", icon: "📦", color: "text-primary", desc: "Ready to ship" },
  { status: "In Transit", icon: "🚚", color: "text-primary", desc: "Cards in the mail" },
  { status: "Delivered", icon: "✅", color: "text-success", desc: "Cards received" },
  { status: "Completed", icon: "🏆", color: "text-success", desc: "Trade finalized" },
  { status: "Disputed", icon: "⚠️", color: "text-destructive", desc: "Issue reported" },
];

export default function TradeCenterPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <Repeat className="h-3.5 w-3.5 mr-1.5" />
            Flagship Feature
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">The </span>
            <span className="text-red-600">
              Trade Center
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A structured negotiation platform where collectors make offers, counter, and close deals — just like real-life trading, but smarter and safer.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" variant="gradient" asChild>
              <Link href="/register">
                Start Trading
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/marketplace">Browse Cards</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Trade Demo */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold">
              How a Trade <span className="text-primary">Negotiation</span> Works
            </h2>
            <p className="mt-2 text-muted-foreground">Real example of the Poké-Trade negotiation flow</p>
          </motion.div>

          {/* Step 1: Create Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Step 1</Badge>
                  <CardTitle className="text-lg">Create Trade Offer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  {/* Offering */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="text-xs font-semibold text-primary mb-3">🎴 YOU OFFER</div>
                    <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg mb-2">
                      <div className="h-12 w-9 bg-muted/40 rounded flex items-center justify-center text-lg">🔥</div>
                      <div>
                        <div className="font-semibold text-sm">Charizard EX</div>
                        <div className="text-xs text-muted-foreground">Obsidian Flames · NM</div>
                      </div>
                      <div className="ml-auto text-sm font-bold text-primary">$45</div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-success/5 rounded-lg border border-success/20">
                      <span className="text-success text-sm">+ $25 cash</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Repeat className="h-6 w-6 text-secondary" />
                    </div>
                  </div>

                  {/* Wanting */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="text-xs font-semibold text-secondary mb-3">🎯 YOU WANT</div>
                    <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                      <div className="h-12 w-9 bg-muted/40 rounded flex items-center justify-center text-lg">🌙</div>
                      <div>
                        <div className="font-semibold text-sm">Umbreon VMAX</div>
                        <div className="text-xs text-muted-foreground">Evolving Skies · NM</div>
                      </div>
                      <div className="ml-auto text-sm font-bold text-secondary">$85</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Value: Charizard EX ($45) + $25 cash</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Value: Umbreon VMAX ($85)</span>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <Badge variant="outline" className="text-success border-success/30">✓ Fair Trade — $70 vs $85</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Arrow */}
          <div className="flex justify-center my-2">
            <ArrowDown className="h-6 w-6 text-muted-foreground/30" />
          </div>

          {/* Step 2: Counter Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="mb-4 border-secondary/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-secondary/20 text-secondary border-secondary/30">Step 2</Badge>
                  <CardTitle className="text-lg">Counter Offer</CardTitle>
                  <Badge variant="outline" className="ml-auto text-xs">Version 2</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-sm">JR</div>
                    <div>
                      <span className="font-semibold text-sm">James R.</span>
                      <span className="text-xs text-muted-foreground ml-2">countered 5 min ago</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-3">
                    &ldquo;I&apos;ll trade the Umbreon VMAX but need an additional $50 total cash to make it fair. The Umbreon is trending up.&rdquo;
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-warning border-warning/30">Cash adjusted: $25 → $50</Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 bg-success hover:bg-success/90">Accept</Button>
                  <Button size="sm" variant="outline" className="flex-1">Counter Again</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10">Decline</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex justify-center my-2">
            <ArrowDown className="h-6 w-6 text-muted-foreground/30" />
          </div>

          {/* Step 3: Agreed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="mb-4 border-green-200 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-success/20 text-success border-success/30">Step 3</Badge>
                  <CardTitle className="text-lg">Trade Agreed 🤝</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/10 rounded-lg">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">TRADE SUMMARY</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>You send:</span>
                        <span className="font-semibold">Charizard EX + $50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>You receive:</span>
                        <span className="font-semibold">Umbreon VMAX</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                    <div className="text-xs font-semibold text-success mb-2">🛡️ PROTECT THIS TRADE</div>
                    <p className="text-xs text-muted-foreground mb-3">Optional: Add third-party authentication before delivery.</p>
                    <Button size="sm" variant="outline" className="w-full text-success border-success/30">Add Authentication — $29.99</Button>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Truck className="h-4 w-4 mr-1" />
                    Upload Tracking Number
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileCheck className="h-4 w-4 mr-1" />
                    View Trade Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trade Statuses */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Trade <span className="text-primary">Lifecycle</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Every trade follows a clear, trackable flow from offer to completion
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TRADE_STATUSES.map((s, i) => (
              <motion.div
                key={s.status}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <div className={`font-semibold text-sm ${s.color}`}>{s.status}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </div>
                </div>
                {i < TRADE_STATUSES.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Negotiation <span className="text-secondary">Features</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need for safe, fair, and transparent card trading
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Scale className="h-5 w-5" />, title: "Fair Value Engine", desc: "Real-time market pricing shows both sides the fair value. No guessing, no lowballing.", color: "text-primary bg-primary/10" },
              { icon: <MessageSquare className="h-5 w-5" />, title: "Unlimited Counter Offers", desc: "No limit on negotiation rounds. Keep countering until both sides are happy.", color: "text-secondary bg-secondary/10" },
              { icon: <History className="h-5 w-5" />, title: "Full Audit Trail", desc: "Every version is stored. See Version 1, 2, 3... Complete negotiation history.", color: "text-warning bg-warning/10" },
              { icon: <Shield className="h-5 w-5" />, title: "Authentication Add-On", desc: "Optional third-party verification (PSA, CGC, BGS) before cards are delivered.", color: "text-success bg-success/10" },
              { icon: <Truck className="h-5 w-5" />, title: "Shipping Verification", desc: "Upload tracking, mark shipped, confirm delivery. Both sides stay informed.", color: "text-primary bg-primary/10" },
              { icon: <Star className="h-5 w-5" />, title: "Post-Trade Reviews", desc: "Rate your trading partner. Build reputation with every successful trade.", color: "text-warning bg-warning/10" },
              { icon: <Repeat className="h-5 w-5" />, title: "Multi-Card + Cash", desc: "Trade multiple cards at once. Add cash to balance any value difference.", color: "text-secondary bg-secondary/10" },
              { icon: <Eye className="h-5 w-5" />, title: "Trade Contract", desc: "Both parties get a trade confirmation summary. Clear terms, no surprises.", color: "text-primary bg-primary/10" },
              { icon: <AlertTriangle className="h-5 w-5" />, title: "Dispute Resolution", desc: "Problems? Open a dispute. We review communications, photos, and tracking.", color: "text-destructive bg-destructive/10" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="h-full hover:border-primary/20 transition-all hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-success/10 text-success border-success/20">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Protect Your Trades
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Optional <span className="text-success">Authentication</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                After both parties agree, either side can add authentication as a trade add-on. Cards ship to an independent verification partner before delivery.
              </p>
              <div className="space-y-4">
                {[
                  { partner: "PSA", desc: "Professional Sports Authenticator — the gold standard" },
                  { partner: "CGC", desc: "Certified Guaranty Company — subgrades included" },
                  { partner: "BGS", desc: "Beckett Grading Services — 4-point subgrading" },
                  { partner: "Poké-Trade Verify", desc: "Our in-house quick verification service" },
                ].map((auth) => (
                  <div key={auth.partner} className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                    <div className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{auth.partner}</div>
                      <div className="text-xs text-muted-foreground">{auth.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-6 bg-success hover:bg-success/90 text-white" asChild>
                <Link href="/protect">
                  Learn More About Authentication
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-success/20">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🛡️</div>
                  <h3 className="text-xl font-bold">Poké-Trade Protect</h3>
                  <p className="text-sm text-muted-foreground mt-1">Coming Soon — Secure Payment Hold + Authentication</p>
                </div>
                <div className="space-y-3">
                  {[
                    "Funds held in secure payment hold until delivery confirmed",
                    "Cards authenticated before release",
                    "Buyer and seller fully protected",
                    "Dispute resolution with financial backing",
                    "Insurance on high-value trades",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-success/5 rounded-lg border border-success/20 text-center">
                  <div className="text-2xl font-bold text-success">$4.99</div>
                  <div className="text-xs text-muted-foreground">per trade (or free with Elite)</div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reputation */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Trader <span className="text-secondary">Ranks</span>
          </h2>
          <p className="text-muted-foreground mb-12 max-w-lg mx-auto">
            Every successful trade builds your reputation. Rise through the ranks.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRADER_LEVELS.map((level, i) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="hover:border-secondary/40 transition-all hover:-translate-y-1">
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="text-3xl mb-2">{level.icon}</div>
                    <h3 className="font-semibold text-xs">{level.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">{level.minTrades}+ trades</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Make Your First <span className="text-primary">Trade</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your free account, build your collection, and start negotiating.
          </p>
          <Button size="xl" variant="gradient" asChild>
            <Link href="/register">
              Start Trading Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
