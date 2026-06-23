"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ArrowRight, BookOpen, FileText, Users, AlertTriangle, Flame, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ProtectMyCollectionPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-success/10 text-success border-success/20">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Collection Protection
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Your Collection is </span>
            <span className="text-success">Valuable.</span>
            <br />
            <span className="text-foreground">Protect It.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your Pokémon card collection could be worth thousands. Make sure it&apos;s properly
            protected with the right insurance coverage from a licensed professional.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" className="bg-success hover:bg-success/90 text-white shadow-sm" asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/dashboard/collection">View My Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Insure */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why <span className="text-success">Insure</span> Your Collection?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Collectible cards face unique risks that standard insurance often doesn&apos;t cover.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Droplets className="h-6 w-6" />,
                title: "Water & Fire Damage",
                desc: "Cards can be destroyed by floods, fires, or even a spilled drink. Disasters don't discriminate.",
              },
              {
                icon: <AlertTriangle className="h-6 w-6" />,
                title: "Theft & Burglary",
                desc: "High-value collections are targets. A single break-in could wipe out years of collecting.",
              },
              {
                icon: <Flame className="h-6 w-6" />,
                title: "Homeowner's Gaps",
                desc: "Most homeowner's and renter's insurance policies exclude or severely limit collectible coverage.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Graded Card Coverage",
                desc: "Professional graded cards (PSA, BGS, CGC) need specialized coverage that reflects their true market value.",
              },
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
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            How It <span className="text-success">Works</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: <BookOpen className="h-6 w-6" />,
                title: "Track Your Collection",
                desc: "Use Poké-Trade's collection tracker to catalog your cards with current market values.",
              },
              {
                step: "2",
                icon: <FileText className="h-6 w-6" />,
                title: "Generate Inventory Report",
                desc: "Export an insurance-ready inventory report with card details, conditions, and valuations.",
              },
              {
                step: "3",
                icon: <Users className="h-6 w-6" />,
                title: "Connect with a Professional",
                desc: "Work with a licensed insurance professional who specializes in collectible coverage.",
              },
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
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Protecting Your <span className="text-success">Collection</span> Today
          </h2>
          <p className="text-muted-foreground mb-8">
            Track your cards, know their value, and get the coverage you need.
          </p>
          <Button size="xl" className="bg-success hover:bg-success/90 text-white" asChild>
            <Link href="/register">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Insurance Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium">ℹ️ Important:</span> The Trade Protection Program is a platform service, not insurance. Benefits are subject to review and approval under our platform terms. For collection insurance, we recommend consulting a licensed insurance professional. Poké-Trade is not an insurance company and does not underwrite, bind, or administer insurance coverage. Insurance products, when available, are offered separately by licensed insurance professionals through approved carrier partners.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
