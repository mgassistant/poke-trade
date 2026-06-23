"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, ArrowRight, BookOpen, FileText, Users, AlertTriangle,
  Flame, Droplets, CheckCircle, Phone, Mail, Loader2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STORAGE_METHODS = [
  { value: "home", label: "At Home (open storage)" },
  { value: "safe", label: "Home Safe" },
  { value: "bank_vault", label: "Bank Vault" },
  { value: "storage_unit", label: "Storage Unit" },
  { value: "other", label: "Other" },
];

export default function ProtectMyCollectionPage() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Lead form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [collectionValue, setCollectionValue] = useState("");
  const [cardCount, setCardCount] = useState("");
  const [hasGraded, setHasGraded] = useState(false);
  const [storageMethod, setStorageMethod] = useState("home");
  const [consent, setConsent] = useState(true);

  const handleSubmitLead = async () => {
    if (!name || !email) {
      setError("Name and email are required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/insurance/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          estimated_collection_value: parseFloat(collectionValue) || undefined,
          number_of_cards: parseInt(cardCount) || undefined,
          has_graded_cards: hasGraded,
          storage_method: storageMethod,
          consent_to_contact: consent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-success/10 text-success border-success/20">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Collection Insurance
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Protect Your Collection with </span>
            <span className="text-success">Specialized Coverage</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get matched with licensed insurance professionals who specialize in
            collectible coverage. Protect your cards against theft, damage, and more.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="xl"
              className="bg-success hover:bg-success/90 text-white shadow-sm"
              onClick={() => {
                const el = document.getElementById("lead-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get a Free Quote
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/dashboard/collection">View My Collection</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-success" />
              Licensed Professionals
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-success" />
              Specialized in Collectibles
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-success" />
              No Obligation
            </span>
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

      {/* How It Works - 3 Steps */}
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
                title: "Generate Your Collection Report",
                desc: "Use your Poké-Trade collection data to create an insurance-ready inventory summary with card details and estimated values.",
              },
              {
                step: "2",
                icon: <Users className="h-6 w-6" />,
                title: "Get Matched with a Specialist",
                desc: "Fill out a quick form and we'll connect you with a licensed insurance professional who specializes in collectible coverage.",
              },
              {
                step: "3",
                icon: <FileText className="h-6 w-6" />,
                title: "Receive Your Custom Quote",
                desc: "Your matched specialist will review your collection and provide a personalized insurance quote — no obligation.",
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

      {/* Lead Form Section */}
      <section id="lead-section" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">
              Get Matched with a <span className="text-success">Specialist</span>
            </h2>
            <p className="text-muted-foreground">
              Fill out the form below and a licensed insurance professional will
              contact you within 1-2 business days.
            </p>
          </div>

          {submitted ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Inquiry Submitted!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Thank you! A licensed insurance specialist will contact you within
                  1-2 business days to discuss your collection coverage options.
                </p>
                <Button variant="outline" className="mt-6" asChild>
                  <Link href="/dashboard/collection">
                    View My Collection <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Estimated Collection Value
                    </label>
                    <input
                      type="number"
                      value={collectionValue}
                      onChange={(e) => setCollectionValue(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                      placeholder="$5,000"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Approximate Number of Cards
                    </label>
                    <input
                      type="number"
                      value={cardCount}
                      onChange={(e) => setCardCount(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Storage Method
                    </label>
                    <select
                      value={storageMethod}
                      onChange={(e) => setStorageMethod(e.target.value)}
                      className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                    >
                      {STORAGE_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={hasGraded}
                    onChange={(e) => setHasGraded(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    id="has-graded"
                  />
                  <label htmlFor="has-graded" className="text-sm">
                    I have professionally graded cards (PSA, BGS, CGC, etc.)
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    id="consent"
                  />
                  <label htmlFor="consent" className="text-sm">
                    I consent to being contacted by a licensed insurance professional
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full bg-success hover:bg-success/90 text-white"
                  onClick={handleSubmitLead}
                  disabled={submitting || !name || !email || !consent}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Get My Free Quote
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  No obligation. Your information is secure and will only be shared
                  with our licensed insurance partner.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Insurance Disclaimer */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium">ℹ️ Important:</span> Insurance products
              are offered by licensed insurance professionals through approved carrier
              partners. Poké-Trade is not an insurance company and does not underwrite,
              bind, or administer insurance coverage. Poké-Trade facilitates connections
              between collectors and licensed professionals as a referral service. The
              Trade Protection Program is a separate platform service and is not insurance.
              Collection values shown are estimates and may not reflect insurable value.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
