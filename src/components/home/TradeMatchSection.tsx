"use client";

import { motion } from "framer-motion";
import { Repeat, BarChart3, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Build Your Collection",
    description: "Add cards you own and mark which ones are available for trade. Build your want list of cards you're looking for.",
  },
  {
    step: "02",
    icon: <Zap className="h-6 w-6 text-secondary" />,
    title: "Get Matched Instantly",
    description: "Our engine scans thousands of collections to find mutual trade opportunities — users who have what you want and want what you have.",
  },
  {
    step: "03",
    icon: <Repeat className="h-6 w-6 text-primary" />,
    title: "Trade & Build Rep",
    description: "Send offers, negotiate fair trades, ship cards with tracking, and earn reputation with every successful trade.",
  },
];

export function TradeMatchSection() {
  return (
    <section className="py-24 border-t border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1.5">
            <Repeat className="h-3.5 w-3.5 mr-1.5" />
            Trade Matching Engine
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Find Your Perfect Trade in <span className="text-primary">Seconds</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Stop scrolling through forums. Our AI-powered matching engine finds mutual trade opportunities automatically.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Card className="relative h-full hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
                <CardContent className="pt-8 pb-6">
                  <span className="text-6xl font-bold text-muted/20 absolute top-4 right-5 group-hover:text-primary/8 transition-colors">
                    {item.step}
                  </span>
                  <div className="h-12 w-12 rounded-xl bg-muted/80 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Connection arrows */}
        <div className="hidden md:flex justify-center mt-8 gap-4 items-center text-muted-foreground/30">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/20" />
          <ArrowRight className="h-4 w-4 text-primary/30" />
          <div className="h-px w-20 bg-primary/20" />
          <ArrowRight className="h-4 w-4 text-primary/30" />
          <div className="h-px w-20 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
