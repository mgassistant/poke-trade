"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Check, Camera, Award, FileCheck, Search, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AUTH_SERVICE_TIERS } from "@/lib/constants";

export default function ProtectPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-success/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-success/10 text-success border-success/20">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Poké-Trade Protect
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Card </span>
            <span className="text-success">Authentication</span>
            <br />
            <span className="text-foreground">You Can Trust</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Protect your investment. Our expert authentication service verifies your Pokémon cards are genuine, 
            assesses condition, and provides a digital certificate — all at a fraction of grading costs.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" className="bg-success hover:bg-success/90 text-white glow-blue" asChild>
              <Link href="/register">
                Get Cards Authenticated
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/pricing">View All Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Authenticate */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why <span className="text-success">Authenticate</span>?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            The Pokémon card market is flooded with fakes. Protect yourself.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="h-6 w-6" />, title: "Fake Protection", desc: "Counterfeit cards are getting better. Our experts catch what the eye misses.", stat: "$500M+", statLabel: "in fakes sold yearly" },
              { icon: <Award className="h-6 w-6" />, title: "Increase Value", desc: "Authenticated cards sell for 20-40% more than unverified cards.", stat: "+35%", statLabel: "avg value increase" },
              { icon: <Lock className="h-6 w-6" />, title: "Buyer Confidence", desc: "Verified badge on your listing means instant trust from buyers.", stat: "2.5x", statLabel: "faster sales" },
              { icon: <Camera className="h-6 w-6" />, title: "Faster Than PSA", desc: "3-10 days vs 3-6 months. Get verified and back to trading fast.", stat: "3-10", statLabel: "day turnaround" },
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
                    <div className="pt-3 border-t border-border/30">
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

      {/* Service Tiers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Authentication <span className="text-primary">Packages</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Choose the level of verification your cards need
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {AUTH_SERVICE_TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card className={`h-full relative ${
                  tier.name === "Premium Authentication" ? "border-success/50 glow-blue" : ""
                }`}>
                  {tier.name === "Premium Authentication" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-4 bg-success text-white border-success">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="pt-10 pb-8">
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      <span className="text-sm text-muted-foreground">/card</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{tier.turnaround} turnaround</p>
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
                        tier.name === "Premium Authentication"
                          ? "bg-success hover:bg-success/90 text-white"
                          : ""
                      }`}
                      variant={tier.name === "Premium Authentication" ? "default" : "outline"}
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
          <p className="text-center text-xs text-muted-foreground mt-8">
            Elite members get 20% off all authentication services. <Link href="/pricing" className="text-primary hover:underline">Upgrade now</Link>
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            How It <span className="text-success">Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: <Camera className="h-6 w-6" />, title: "Submit Photos", desc: "Upload clear front and back photos of your card through our platform." },
              { step: "2", icon: <Search className="h-6 w-6" />, title: "Expert Review", desc: "Our authentication experts examine texture, printing, and details." },
              { step: "3", icon: <FileCheck className="h-6 w-6" />, title: "Get Certified", desc: "Receive your digital authentication certificate with unique QR code." },
              { step: "4", icon: <Sparkles className="h-6 w-6" />, title: "Trade with Trust", desc: "Your verified badge appears on all listings and trades." },
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

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Protect Your <span className="text-success">Collection</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Don&apos;t let counterfeits ruin your investment. Get your cards authenticated today.
          </p>
          <Button size="xl" className="bg-success hover:bg-success/90 text-white" asChild>
            <Link href="/register">
              Start Authentication
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
