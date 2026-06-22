"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bell, ArrowRight, Check, Zap, Clock, ShoppingCart, Smartphone, Globe, Crown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const RETAILERS = [
  { name: "Pokémon Center", icon: "🎯", status: "Live", products: 45, color: "text-primary" },
  { name: "Target", icon: "🎯", status: "Live", products: 32, color: "text-destructive" },
  { name: "Walmart", icon: "🏪", status: "Live", products: 28, color: "text-primary" },
  { name: "Amazon", icon: "📦", status: "Live", products: 65, color: "text-warning" },
  { name: "GameStop", icon: "🎮", status: "Live", products: 22, color: "text-destructive" },
  { name: "Best Buy", icon: "💻", status: "Live", products: 18, color: "text-primary" },
  { name: "TCGPlayer", icon: "🃏", status: "Live", products: "500+", color: "text-secondary" },
  { name: "eBay Deals", icon: "🔨", status: "Coming Soon", products: "—", color: "text-muted-foreground" },
];

const RECENT_DROPS = [
  { product: "Prismatic Evolutions Elite Trainer Box", retailer: "Pokémon Center", time: "2 min ago", status: "In Stock", price: "$54.99" },
  { product: "Surging Sparks Booster Box", retailer: "Target", time: "8 min ago", status: "In Stock", price: "$143.99" },
  { product: "Chaos Rising ETB", retailer: "Amazon", time: "15 min ago", status: "Sold Out", price: "$49.99" },
  { product: "Crown Zenith Premium Collection", retailer: "Walmart", time: "22 min ago", status: "Low Stock", price: "$39.99" },
  { product: "Obsidian Flames Booster Box", retailer: "GameStop", time: "35 min ago", status: "In Stock", price: "$129.99" },
  { product: "151 Ultra-Premium Collection", retailer: "Pokémon Center", time: "1 hour ago", status: "Sold Out", price: "$119.99" },
];

export default function DropsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-warning/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-warning/10 text-warning border-warning/20">
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Drop Alerts
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Never Miss a </span>
            <span className="text-warning">Restock</span>
            <br />
            <span className="text-foreground">Again</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time alerts when Pokémon cards restock at retail. Pokémon Center, Target, Walmart, Amazon, GameStop — all monitored 24/7. Get notified in seconds, not minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" className="bg-warning hover:bg-warning/90 text-black font-semibold" asChild>
              <Link href="/register">
                <Bell className="h-4 w-4 mr-1" />
                Enable Drop Alerts
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free: 3 alerts/day · Pro: Unlimited · Elite: Priority alerts (30s faster)
          </p>
        </div>
      </section>

      {/* Live Feed Preview */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Recent drops */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <h2 className="text-2xl font-bold">Live Drop Feed</h2>
              </div>
              <div className="space-y-3">
                {RECENT_DROPS.map((drop, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="hover:border-warning/20 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="shrink-0">
                          <Bell className="h-5 w-5 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{drop.product}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{drop.retailer}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{drop.time}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm">{drop.price}</div>
                          <Badge
                            variant={drop.status === "In Stock" ? "default" : drop.status === "Low Stock" ? "warning" : "outline"}
                            className={`text-[10px] ${
                              drop.status === "In Stock" ? "bg-success/20 text-success border-success/20" :
                              drop.status === "Low Stock" ? "bg-warning/20 text-warning border-warning/20" :
                              "text-muted-foreground"
                            }`}
                          >
                            {drop.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                How <span className="text-warning">Drop Alerts</span> Work
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Target className="h-5 w-5" />,
                    title: "We Monitor 24/7",
                    desc: "Our bots check major retailers every 30-60 seconds for stock changes, price drops, and new listings.",
                  },
                  {
                    icon: <Zap className="h-5 w-5" />,
                    title: "Instant Detection",
                    desc: "The moment stock appears, we detect it — usually within 30 seconds of going live.",
                  },
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Push Notification",
                    desc: "Get notified instantly via push notification, email, or in-app alert. You choose how.",
                  },
                  {
                    icon: <ShoppingCart className="h-5 w-5" />,
                    title: "One-Tap Buy",
                    desc: "Direct links take you straight to the product page. Add to cart before it sells out.",
                  },
                ].map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monitored Retailers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Monitored <span className="text-primary">Retailers</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            We track stock across every major Pokémon card retailer
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {RETAILERS.map((retailer, i) => (
              <motion.div
                key={retailer.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="text-center hover:border-warning/30 transition-all hover:-translate-y-1">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl mb-2">{retailer.icon}</div>
                    <h3 className="font-semibold text-sm">{retailer.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          retailer.status === "Live" ? "text-success border-success/30" : "text-muted-foreground"
                        }`}
                      >
                        {retailer.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{retailer.products} products</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Alert Types */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Alert <span className="text-warning">Types</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "📦", title: "Restock Alert", desc: "Sold-out product is back in stock at any retailer" },
              { icon: "💰", title: "Price Drop", desc: "Product price falls below your target threshold" },
              { icon: "🆕", title: "New Release", desc: "Brand new product listing goes live at retail" },
              { icon: "⚡", title: "Flash Deal", desc: "Limited-time sale or clearance on Pokémon products" },
            ].map((type, i) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full text-center hover:border-warning/20 transition-all">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <h3 className="font-semibold text-sm mb-1">{type.title}</h3>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing tiers for alerts */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Drop Alert <span className="text-primary">Plans</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                features: [
                  "3 alerts per day",
                  "5-minute delay on alerts",
                  "Pokémon Center + Target only",
                  "In-app notifications only",
                ],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Pro",
                price: "$9.99/mo",
                features: [
                  "Unlimited alerts",
                  "Real-time (< 60 second delay)",
                  "All 7 retailers monitored",
                  "Push + Email + In-app alerts",
                  "Custom product watchlists",
                  "Price drop thresholds",
                ],
                cta: "Go Pro",
                popular: true,
              },
              {
                name: "Elite",
                price: "$19.99/mo",
                features: [
                  "Everything in Pro",
                  "Priority alerts (30 seconds faster)",
                  "Exclusive pre-release intel",
                  "Sealed product price tracking",
                  "Investment analytics on sealed",
                  "SMS alerts (coming soon)",
                ],
                cta: "Go Elite",
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card className={`h-full relative ${plan.popular ? "border-warning/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-4 bg-warning text-black border-warning font-semibold">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="pt-10 pb-8">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <div className="mt-3 text-3xl font-bold">{plan.price}</div>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-8 ${plan.popular ? "bg-warning hover:bg-warning/90 text-black" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <Link href="/register">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Drop Alerts are included with Pro and Elite memberships at no extra cost.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop Refreshing. Start <span className="text-warning">Getting Alerts</span>.
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of collectors who never miss a drop. Free to start.
          </p>
          <Button size="xl" className="bg-warning hover:bg-warning/90 text-black font-semibold" asChild>
            <Link href="/register">
              <Bell className="h-4 w-4 mr-1" />
              Enable Drop Alerts
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
