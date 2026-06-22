"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, ExternalLink, CheckCircle2, AlertTriangle, ArrowRight, Fingerprint, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const GRADING_COMPANIES = [
  {
    name: "PSA",
    fullName: "Professional Sports Authenticator",
    verifyUrl: "https://www.psacard.com/cert/",
    icon: "🏆",
    color: "text-red-400 bg-red-400/10",
    description: "The gold standard in card grading. Look up any PSA cert number to verify authenticity.",
    placeholder: "Enter PSA cert number (e.g. 10000001)",
    prefix: "https://www.psacard.com/cert/",
  },
  {
    name: "BGS",
    fullName: "Beckett Grading Services",
    verifyUrl: "https://www.beckett.com/grading/card-lookup/",
    icon: "💎",
    color: "text-blue-400 bg-blue-400/10",
    description: "Premier grading with 4-point subgrades. Verify any BGS slab online.",
    placeholder: "Enter BGS serial number",
    prefix: "https://www.beckett.com/grading/card-lookup/",
  },
  {
    name: "CGC",
    fullName: "Certified Guaranty Company",
    verifyUrl: "https://www.cgccards.com/certlookup/",
    icon: "🛡️",
    color: "text-green-400 bg-green-400/10",
    description: "Growing fast in Pokémon grading. Subgrades included with every grade.",
    placeholder: "Enter CGC cert number",
    prefix: "https://www.cgccards.com/certlookup/",
  },
  {
    name: "SGC",
    fullName: "Sportscard Guaranty Corporation",
    verifyUrl: "https://gosgc.com/card-search",
    icon: "⚡",
    color: "text-yellow-400 bg-yellow-400/10",
    description: "Respected grading service with competitive pricing.",
    placeholder: "Enter SGC cert number",
    prefix: "https://gosgc.com/card-search?q=",
  },
];

const TIPS = [
  { icon: "🔍", title: "Check the Label", tip: "Genuine PSA slabs have holographic labels with a QR code. Fakes often have blurry text or wrong fonts." },
  { icon: "⚖️", title: "Weigh the Slab", tip: "Real PSA slabs weigh 2.1-2.3 oz. Fakes are often lighter (cheap plastic) or heavier (thick resin)." },
  { icon: "📐", title: "Measure Dimensions", tip: "PSA slabs are exactly 5.25\" × 3.5\" × 0.25\". Even small deviations indicate a counterfeit." },
  { icon: "💡", title: "UV Light Test", tip: "Real PSA labels glow under UV light. Counterfeit labels appear dull or inconsistent." },
  { icon: "🔢", title: "Verify the Cert", tip: "Always check the cert number on PSA's website. If it doesn't match the card in the slab, it's fake." },
  { icon: "📸", title: "Request Photos", tip: "Ask sellers for photos of the front, back, label, AND edge of the slab before buying." },
];

export default function VerifyPage() {
  const [selectedGrader, setSelectedGrader] = useState(GRADING_COMPANIES[0]);
  const [certNumber, setCertNumber] = useState("");

  const handleVerify = () => {
    if (!certNumber.trim()) return;
    window.open(`${selectedGrader.prefix}${certNumber.trim()}`, "_blank");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-success/10 text-success border-success/20">
            <Fingerprint className="h-3.5 w-3.5 mr-1.5" />
            Slab Verification
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Verify Any <span className="text-success">Graded Slab</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Look up cert numbers from PSA, BGS, CGC, and SGC to verify authenticity before you buy or trade.
          </p>
        </div>

        {/* Verification Tool */}
        <Card className="mb-8 border-green-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              Slab Lookup Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Grader selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {GRADING_COMPANIES.map((grader) => (
                <button
                  key={grader.name}
                  onClick={() => { setSelectedGrader(grader); setCertNumber(""); }}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedGrader.name === grader.name
                      ? "bg-white rounded-xl border border-green-300 shadow-sm"
                      : "bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm"
                  }`}
                >
                  <div className="text-2xl mb-1">{grader.icon}</div>
                  <div className="font-bold text-sm">{grader.name}</div>
                  <div className="text-[10px] text-muted-foreground">{grader.fullName}</div>
                </button>
              ))}
            </div>

            {/* Cert input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={selectedGrader.placeholder}
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <Button
                size="lg"
                className="bg-success hover:bg-success/90 text-white h-12"
                onClick={handleVerify}
                disabled={!certNumber.trim()}
              >
                Verify
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Opens {selectedGrader.name}&apos;s official verification page in a new tab. Always verify directly with the grading company.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {GRADING_COMPANIES.map((grader) => (
            <a
              key={grader.name}
              href={grader.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:border-success/20 transition-all hover:-translate-y-1 cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${grader.color}`}>
                    <span className="text-lg">{grader.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{grader.name} Lookup</h3>
                  <p className="text-xs text-muted-foreground">{grader.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-success">
                    Visit {grader.name} <ExternalLink className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        {/* Fake Detection Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-2">
            How to Spot <span className="text-destructive">Fake Slabs</span>
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Counterfeit graded cards are a growing problem. Here&apos;s how to protect yourself.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIPS.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-5">
                    <div className="text-2xl mb-2">{tip.icon}</div>
                    <h3 className="font-semibold text-sm mb-1">{tip.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* PSA Pop Report via our API */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              PSA Population Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our Compare Prices tool includes PSA population reports and graded card pricing data for every Pokémon card — powered by our PokemonPriceTracker Pro integration.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "PSA 10 Population", desc: "How many PSA 10s exist for any card" },
                { label: "Grade Distribution", desc: "Full breakdown: PSA 1-10 + qualifiers" },
                { label: "Graded Sold Prices", desc: "eBay sold prices by grade (1d/7d/30d)" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-muted/20 rounded-lg">
                  <div className="font-semibold text-sm text-primary">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" asChild>
              <Link href="/compare">
                Search Card Prices & Pop Data
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">
            Trading Graded Cards? <span className="text-success">Stay Protected.</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Always verify before you buy. Use our authentication services for extra protection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button className="bg-success hover:bg-success/90 text-white" asChild>
              <Link href="/protect">
                Poké-Trade Authentication
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/safety">Trust & Safety</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
