"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Repeat, ArrowRight, Search, Users, Shield, TrendingUp, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TRADER_LEVELS } from "@/lib/constants";

export default function TradeCenterPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <Repeat className="h-3.5 w-3.5 mr-1.5" />
            Flagship Feature
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">The </span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text" style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Trade Center
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our intelligent trade matching engine finds collectors who have what you want — and want what you have. No more forum posts. No more DMs. Just smart, automatic matching.
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

      {/* How it works */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            How <span className="text-primary">Trading</span> Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: <Search className="h-6 w-6" />, title: "Build Your Lists", desc: "Add cards to your collection and want list. Mark which cards are available for trade." },
              { step: "2", icon: <Users className="h-6 w-6" />, title: "Get Matched", desc: "Our engine scans all collections and finds users with mutual trade opportunities." },
              { step: "3", icon: <Package className="h-6 w-6" />, title: "Make & Ship", desc: "Send trade offers, negotiate, accept, and ship cards with tracking numbers." },
              { step: "4", icon: <Star className="h-6 w-6" />, title: "Rate & Level Up", desc: "Leave reviews after trades. Build your reputation and climb the trader ranks." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full text-center hover:border-primary/30 transition-all">
                  <CardContent className="pt-8 pb-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      {item.icon}
                    </div>
                    <div className="text-xs text-primary font-bold mb-2">STEP {item.step}</div>
                    <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Trade <span className="text-secondary">Features</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Everything you need for safe, fair, and easy card trading
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Smart Matching", desc: "AI-powered matching finds mutual trade opportunities across thousands of collections in real-time.", icon: "🔮" },
              { title: "Fair Value Engine", desc: "Real-time market pricing ensures both sides get a fair deal. See value comparisons before you trade.", icon: "⚖️" },
              { title: "Counter Offers", desc: "Not quite right? Send counter offers with different cards or add cash to balance the trade.", icon: "🔄" },
              { title: "Multi-Card Trades", desc: "Trade multiple cards at once. Build complex offers with cards from different sets and conditions.", icon: "🃏" },
              { title: "Shipping Tracking", desc: "Both sides add tracking numbers. Get notified when cards ship and when they arrive.", icon: "📦" },
              { title: "Buyer Protection", desc: "Dispute resolution, verified traders, and review system keeps everyone honest.", icon: "🛡️" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:border-secondary/30 transition-all hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reputation */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Trader <span className="text-secondary">Ranks</span>
          </h2>
          <p className="text-muted-foreground mb-12 max-w-lg mx-auto">
            Every successful trade builds your reputation. Rise through the ranks from Rookie to Pokémon Master.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRADER_LEVELS.map((level, i) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="hover:border-secondary/40 transition-all hover:-translate-y-1">
                  <CardContent className="pt-6 pb-4 text-center">
                    <div className="text-4xl mb-2">{level.icon}</div>
                    <h3 className="font-semibold text-xs sm:text-sm">{level.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{level.minTrades}+ trades</p>
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
            Ready to Find Your <span className="text-primary">Perfect Trade</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your free account, add your collection, and let the matching engine do the work.
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
