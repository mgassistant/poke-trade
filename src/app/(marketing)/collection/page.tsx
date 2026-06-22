"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight, Check, Plus, TrendingUp, Award, Layers, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function CollectionPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Collection Tracker
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Track Every Card.{" "}
                <span className="text-primary">Know Your Worth.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                The most powerful Pokémon card collection tracker. Real-time market pricing, portfolio analytics, grading support, and set completion tracking.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Real-time TCGPlayer market pricing",
                  "Portfolio value tracking & growth charts",
                  "Graded slabs & raw card support (PSA, BGS, CGC)",
                  "Set completion progress tracking",
                  "Purchase price & ROI analytics",
                  "Upload photos of your cards",
                  "Mark cards for trade or sale",
                  "Export collection data as CSV",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex gap-4">
                <Button size="xl" variant="gradient" asChild>
                  <Link href="/register">
                    Start Tracking Free
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-6 glow-blue">
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <div className="text-3xl font-bold text-primary">$24,650</div>
                    </div>
                    <Badge variant="success">+12.4%</Badge>
                  </div>
                  <div className="h-28 bg-muted/20 rounded-xl flex items-end justify-around p-3 gap-1 border border-border/30">
                    {[35, 42, 38, 55, 48, 62, 58, 72, 68, 78, 82, 90].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                        className="bg-gradient-to-t from-primary/40 to-primary rounded-t w-full"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Cards", value: "847", icon: <Layers className="h-3.5 w-3.5" /> },
                      { label: "Graded", value: "42", icon: <Award className="h-3.5 w-3.5" /> },
                      { label: "Sets", value: "23", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                      { label: "Trade", value: "156", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-2 bg-muted/20 rounded-lg">
                        <div className="flex items-center justify-center text-muted-foreground mb-1">{stat.icon}</div>
                        <div className="font-bold text-sm">{stat.value}</div>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            Collection <span className="text-primary">Features</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Plus className="h-5 w-5" />, title: "Quick Add", desc: "Search our database of 100K+ cards and add them to your collection in seconds.", color: "text-primary bg-primary/10" },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Value Tracking", desc: "Watch your portfolio value change in real-time with TCGPlayer market data.", color: "text-success bg-success/10" },
              { icon: <Award className="h-5 w-5" />, title: "Grading Support", desc: "Track PSA, BGS, CGC, SGC grades. See how grading affects your card values.", color: "text-secondary bg-secondary/10" },
              { icon: <Layers className="h-5 w-5" />, title: "Set Tracking", desc: "See completion progress for every set. Know exactly which cards you still need.", color: "text-primary bg-primary/10" },
              { icon: <Camera className="h-5 w-5" />, title: "Photo Upload", desc: "Upload photos of your cards. Document condition, show off your best pulls.", color: "text-warning bg-warning/10" },
              { icon: <BarChart3 className="h-5 w-5" />, title: "Analytics", desc: "Breakdown by set, rarity, type. See your most valuable cards and biggest gains.", color: "text-secondary bg-secondary/10" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:border-primary/20 transition-all hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
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
          <h2 className="text-3xl font-bold mb-4">
            Stop Guessing. Start <span className="text-primary">Tracking</span>.
          </h2>
          <p className="text-muted-foreground mb-8">
            Free collection tracking for everyone. Premium analytics for serious collectors.
          </p>
          <Button size="xl" variant="gradient" asChild>
            <Link href="/register">
              Create Free Account
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
