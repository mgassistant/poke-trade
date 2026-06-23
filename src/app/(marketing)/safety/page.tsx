"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, ArrowRight, Check, Lock, Eye, AlertTriangle, Ban,
  Fingerprint, Phone, Mail, Camera, Clock, Scale, Truck,
  FileCheck, UserCheck, ShieldCheck, Gavel, CreditCard, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const VERIFICATION_LEVELS = [
  {
    level: "Email Verified",
    icon: <Mail className="h-5 w-5" />,
    color: "text-muted-foreground bg-muted",
    limits: "3 trades/week · $100 max · 5 listings · No selling",
    requirements: ["Verify email address"],
  },
  {
    level: "Phone Verified",
    icon: <Phone className="h-5 w-5" />,
    color: "text-primary bg-primary/10",
    limits: "10 trades/week · $500 max · 25 listings · Selling enabled",
    requirements: ["Verify phone number (SMS code)"],
  },
  {
    level: "ID Verified",
    icon: <Fingerprint className="h-5 w-5" />,
    color: "text-success bg-success/10",
    limits: "50 trades/week · $5,000 max · 100 listings · Full access",
    requirements: ["Government ID via Stripe Identity ($1.50)"],
  },
  {
    level: "Trusted Trader",
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "text-warning bg-warning/10",
    limits: "Unlimited · No caps · Priority support",
    requirements: ["50+ trades completed", "4.5+ average rating", "0 disputes in 90 days"],
  },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-success/10 text-success border-success/20">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Trust & Safety
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-foreground">Trade with </span>
            <span className="text-success">Confidence</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            7 layers of protection keep you safe from scams, fakes, and fraud. From identity verification to secure payment holds — we provide the tools you need to trade with confidence.
          </p>
        </div>
      </section>

      {/* 7 Layers */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            7 Layers of <span className="text-success">Protection</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">Every transaction is protected from start to finish</p>

          <div className="space-y-4 max-w-4xl mx-auto">
            {[
              {
                layer: 1,
                icon: <UserCheck className="h-5 w-5" />,
                title: "Identity Verification",
                desc: "Email, phone, and government ID verification. New accounts are restricted until verified. Bad actors can't just create throwaway accounts.",
                features: ["Email verification required", "Phone SMS verification", "Government ID for high-value sellers", "Verified badge on profile"],
              },
              {
                layer: 2,
                icon: <Camera className="h-5 w-5" />,
                title: "Listing Protection",
                desc: "Mandatory real photos, duplicate detection, and auto-flagging of suspicious listings that are priced way below market value.",
                features: ["Front + back photos required ($50+)", "Duplicate image detection", "Auto-flag below 30% market value", "No stock images allowed"],
              },
              {
                layer: 3,
                icon: <CreditCard className="h-5 w-5" />,
                title: "Secure Payment Holds",
                desc: "All marketplace payments are held in a secure payment hold. Sellers only get paid after the buyer confirms receipt and passes the 48-hour inspection window.",
                features: ["Stripe holds funds until delivery", "48-hour buyer inspection window", "One-click dispute during inspection", "Automatic release after window"],
              },
              {
                layer: 4,
                icon: <Truck className="h-5 w-5" />,
                title: "Shipping Verification",
                desc: "Tracking numbers required for trades and sales over $25. Delivery confirmation needed before funds release.",
                features: ["Mandatory tracking ($25+)", "Delivery confirmation", "Photo proof of packaging ($100+)", "Carrier integration"],
              },
              {
                layer: 5,
                icon: <Scale className="h-5 w-5" />,
                title: "Reputation System",
                desc: "Trade score, star ratings, and reviews visible on every profile. New users have restricted limits. Trust is earned, not assumed.",
                features: ["Star ratings + written reviews", "Trade score on every profile", "New user warning badge (< 30 days)", "Progressive trust limits"],
              },
              {
                layer: 6,
                icon: <Zap className="h-5 w-5" />,
                title: "Automated Fraud Detection",
                desc: "Our system watches for suspicious patterns: multiple accounts, wash trading, abnormal dispute rates, and rapid-fire listings.",
                features: ["Multi-account detection", "Wash trading detection", "Auto-suspend at 3 disputes/month", "Rate limiting on listings"],
              },
              {
                layer: 7,
                icon: <Gavel className="h-5 w-5" />,
                title: "Dispute Resolution",
                desc: "Both parties can open disputes with photo evidence. Admin reviews communications, tracking, and photos. All records preserved permanently.",
                features: ["Photo evidence upload", "Admin review process", "Resolution options: refund/return/warning", "Permanent audit trail"],
              },
            ].map((layer, i) => (
              <motion.div
                key={layer.layer}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="hover:border-success/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-5">
                      <div className="shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                          {layer.icon}
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-[10px] font-bold text-success">LAYER {layer.layer}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base mb-1">{layer.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{layer.desc}</p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {layer.features.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-xs">
                              <Check className="h-3 w-3 text-success shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Levels */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Verification <span className="text-primary">Levels</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">Higher verification = more trust = higher limits</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VERIFICATION_LEVELS.map((level, i) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${level.color}`}>
                      {level.icon}
                    </div>
                    <h3 className="font-bold text-sm mb-1">{level.level}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{level.limits}</p>
                    <Separator className="my-3" />
                    <div className="space-y-1.5">
                      {level.requirements.map((req) => (
                        <div key={req} className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-success shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Hold Explainer */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            How <span className="text-primary">Payment Holds</span> Protect You
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", icon: <CreditCard className="h-6 w-6" />, title: "Buyer Pays", desc: "Payment processed securely via Stripe. Funds held in a secure payment hold — not released to seller." },
              { step: "2", icon: <Truck className="h-6 w-6" />, title: "Seller Ships", desc: "Seller ships with tracking. Both parties see real-time status." },
              { step: "3", icon: <Eye className="h-6 w-6" />, title: "48hr Inspection", desc: "Buyer has 48 hours to inspect the card and confirm it matches the listing." },
              { step: "4", icon: <Check className="h-6 w-6" />, title: "Funds Released", desc: "After approval (or 48hr auto-release), seller receives payment." },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center h-full">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      {step.icon}
                    </div>
                    <div className="text-[10px] text-primary font-bold mb-1">STEP {step.step}</div>
                    <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Banned Activities */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-destructive">Zero Tolerance</span> Policy
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Selling counterfeit or fake cards",
              "Misrepresenting card condition or grade",
              "Creating multiple accounts to evade bans",
              "Wash trading (trading with yourself)",
              "Manipulating trade/review scores",
              "Failing to ship after trade agreement",
              "Using stolen photos from other sellers",
              "Harassment or threats to other users",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10"
              >
                <Ban className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Violations result in immediate account suspension and permanent ban.
          </p>
        </div>
      </section>

      {/* Insurance Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium">ℹ️ Important:</span> The Trade Protection Program is a platform service, not insurance. Benefits are subject to review and approval under our platform terms. For collection insurance, we recommend consulting a licensed insurance professional.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            The Safest Place to <span className="text-success">Trade Cards</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            7 layers of protection. Verified traders. Secure payment holds. Join the community that takes trust seriously.
          </p>
          <Button size="xl" className="bg-success hover:bg-success/90 text-white" asChild>
            <Link href="/register">
              Create Verified Account
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
