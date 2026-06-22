"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Repeat,
  BarChart3,
  Users,
  Star,
  Zap,
  Check,
  Sparkles,
  Crown,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_TIERS, TRADER_LEVELS } from "@/lib/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ========== HERO ========== */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Now in Early Access
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-foreground">The Ultimate</span>
              <br />
              <span className="gradient-primary bg-clip-text text-transparent" style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Pokémon Card
              </span>
              <br />
              <span className="text-foreground">Trading Marketplace</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Trade, buy, sell, and track Pokémon cards without marketplace-level fees.
              Smart trade matching. Collection tracking. Trusted reputation system.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="gradient" asChild>
                <Link href="/register">
                  Start Trading
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { label: "Cards Listed", value: "50K+" },
                { label: "Active Traders", value: "2,500+" },
                { label: "Trades Completed", value: "12K+" },
                { label: "Marketplace Fee", value: "3-5%" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== HOW TRADE MATCHING WORKS ========== */}
      <section className="py-24 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="mb-4">
              <Repeat className="h-3.5 w-3.5 mr-1.5" />
              Trade Matching Engine
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Find Your Perfect Trade in <span className="text-primary">Seconds</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Our intelligent trade matching engine automatically finds collectors who have what you want — and want what you have.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <BarChart3 className="h-6 w-6 text-primary" />,
                title: "Build Your Collection",
                description: "Add cards to your collection and want list. Mark cards available for trade.",
              },
              {
                step: "02",
                icon: <Zap className="h-6 w-6 text-secondary" />,
                title: "Get Matched",
                description: "Our engine scans thousands of collections to find mutual trade opportunities.",
              },
              {
                step: "03",
                icon: <Repeat className="h-6 w-6 text-primary" />,
                title: "Complete the Trade",
                description: "Send offers, negotiate, ship cards, and build your reputation.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <Card className="relative h-full hover:border-primary/30 transition-colors group">
                  <CardContent className="pt-6">
                    <span className="text-5xl font-bold text-muted/30 absolute top-4 right-4 group-hover:text-primary/10 transition-colors">
                      {item.step}
                    </span>
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED LISTINGS ========== */}
      <section className="py-24 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Featured <span className="text-primary">Listings</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Discover rare cards from trusted sellers
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: "Charizard VMAX", set: "Darkness Ablaze", price: "$89.99", rarity: "Ultra Rare" },
              { name: "Pikachu VMAX", set: "Vivid Voltage", price: "$45.00", rarity: "Rainbow" },
              { name: "Umbreon VMAX", set: "Evolving Skies", price: "$320.00", rarity: "Alt Art" },
              { name: "Lugia V", set: "Silver Tempest", price: "$155.00", rarity: "Alt Art" },
            ].map((card, i) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="group cursor-pointer hover:border-primary/30 transition-all hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="aspect-[3/4] rounded-md bg-muted/50 mb-3 flex items-center justify-center overflow-hidden">
                      <div className="text-4xl">🃏</div>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">{card.rarity}</Badge>
                    <h3 className="font-semibold text-sm truncate">{card.name}</h3>
                    <p className="text-xs text-muted-foreground">{card.set}</p>
                    <p className="text-primary font-bold mt-2">{card.price}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                View All Listings
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== MARKETPLACE BENEFITS ========== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Why Traders Choose <span className="text-primary">Poké-Trade</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: "Lower Fees",
                description: "3-5% fees vs 12-15% on other platforms. Keep more of your money.",
              },
              {
                icon: <Repeat className="h-5 w-5" />,
                title: "Trade-First Platform",
                description: "Built for trading, not just selling. Smart matching finds mutual swaps.",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Trusted Reputation",
                description: "Verified traders, reviews, and a leveling system you can trust.",
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "Portfolio Tracking",
                description: "Track your collection value in real-time with market analytics.",
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: "Active Community",
                description: "Connect with collectors, share pulls, and showcase your best cards.",
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: "Lightning Fast",
                description: "Modern platform built for speed. Search, list, and trade in seconds.",
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="h-full hover:border-primary/20 transition-colors">
                  <CardContent className="pt-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TRUSTED TRADER PROGRAM ========== */}
      <section className="py-24 bg-card/30 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Trophy className="h-3.5 w-3.5 mr-1.5" />
              Reputation System
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Rise Through the <span className="text-secondary">Ranks</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Build your reputation with every successful trade. Earn badges, unlock perks, and become a trusted Pokémon Master.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRADER_LEVELS.map((level, i) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <Card className="text-center h-full hover:border-secondary/30 transition-colors">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl mb-2">{level.icon}</div>
                    <h3 className="font-semibold text-sm">{level.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{level.minTrades}+ trades</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COLLECTION TRACKING ========== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <Badge className="mb-4">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Collection Tracker
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Know What Your Collection Is <span className="text-primary">Worth</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Track every card, monitor market values, and watch your portfolio grow. From raw cards to graded slabs.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Real-time market value tracking",
                  "Portfolio performance charts",
                  "Graded & raw card support",
                  "Set completion progress",
                  "Purchase price & ROI tracking",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/register">
                  Start Tracking Free
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Collection Value</span>
                    <Badge variant="success">+12.4%</Badge>
                  </div>
                  <div className="text-4xl font-bold text-primary">$24,650</div>
                  <div className="h-32 bg-muted/30 rounded-lg flex items-end justify-around p-4 gap-1">
                    {[40, 55, 45, 65, 70, 60, 80, 75, 90, 85, 95, 100].map((h, i) => (
                      <div
                        key={i}
                        className="bg-primary/60 rounded-t w-full"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Cards</div>
                      <div className="font-bold">847</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Graded</div>
                      <div className="font-bold">42</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sets</div>
                      <div className="font-bold">23</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== PREMIUM MEMBERSHIP ========== */}
      <section className="py-24 bg-card/30 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Premium Plans
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Upgrade Your Trading <span className="text-secondary">Game</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {SUBSCRIPTION_TIERS.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
              >
                <Card
                  className={`h-full relative ${
                    tier.id === "pro"
                      ? "border-primary/50 glow-blue"
                      : ""
                  }`}
                >
                  {tier.id === "pro" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6">
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {tier.price === 0 ? "Free" : `$${tier.price}`}
                      </span>
                      {tier.price > 0 && (
                        <span className="text-sm text-muted-foreground">/month</span>
                      )}
                    </div>
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={tier.id === "pro" ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/register">
                        {tier.price === 0 ? "Get Started" : "Subscribe"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Trusted by <span className="text-primary">Collectors</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Alex K.",
                role: "Pokémon Master",
                review: "Finally a platform built for trading, not just selling. Found 15 trade matches in my first week!",
                rating: 5,
              },
              {
                name: "Sarah M.",
                role: "Elite Collector",
                review: "The collection tracker alone is worth it. I can see my portfolio value grow in real-time.",
                rating: 5,
              },
              {
                name: "James R.",
                role: "Pro Trader",
                review: "3% fees vs 13% on eBay? No brainer. Plus the reputation system weeds out bad actors.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">&ldquo;{testimonial.review}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 gradient-primary opacity-10" />
            <div className="absolute inset-0 bg-card/80" />
            <div className="relative z-10 text-center py-16 px-6">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Ready to Start <span className="text-primary">Trading</span>?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                Join thousands of Pokémon card collectors and traders. Create your free account today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="xl" variant="gradient" asChild>
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/marketplace">Explore Marketplace</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
