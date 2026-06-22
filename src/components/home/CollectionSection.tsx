"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function CollectionSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Portfolio Tracker
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Know What Your Collection Is{" "}
              <span className="text-primary">Really Worth</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Track every card with real-time market pricing. Monitor portfolio growth, track ROI on purchases, and never miss a value spike.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Real-time TCGPlayer market pricing",
                "Portfolio performance & growth charts",
                "Graded slabs & raw card tracking",
                "Set completion progress bars",
                "Purchase price & ROI analytics",
                "Export collection data anytime",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8" size="lg" asChild>
              <Link href="/register">
                Start Tracking Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="p-8 glow-blue">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-muted-foreground">Total Collection Value</span>
                    <div className="text-4xl font-bold text-primary mt-1">$24,650</div>
                  </div>
                  <Badge variant="success" className="text-sm px-3 py-1">+12.4% this month</Badge>
                </div>

                {/* Chart mockup */}
                <div className="h-36 bg-muted/20 rounded-xl flex items-end justify-around p-4 gap-1 border border-border/30">
                  {[35, 42, 38, 55, 48, 62, 58, 72, 68, 78, 82, 90].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                      className="bg-gradient-to-t from-primary/40 to-primary rounded-t w-full"
                    />
                  ))}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Cards", value: "847" },
                    { label: "Graded", value: "42" },
                    { label: "Sets", value: "23" },
                    { label: "For Trade", value: "156" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="font-bold text-lg">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Top cards */}
                <div>
                  <div className="text-sm font-medium mb-3">Most Valuable Cards</div>
                  <div className="space-y-2">
                    {[
                      { name: "Charizard VMAX Alt Art", value: "$420", change: "+8%" },
                      { name: "Umbreon VMAX Alt Art", value: "$320", change: "+15%" },
                      { name: "Pikachu VMAX Rainbow", value: "$185", change: "+3%" },
                    ].map((card) => (
                      <div key={card.name} className="flex items-center justify-between text-sm p-2 bg-muted/10 rounded-lg">
                        <span className="text-muted-foreground">{card.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{card.value}</span>
                          <span className="text-success text-xs">{card.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
