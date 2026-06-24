"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Shield,
  Star,
  Zap,
  ChevronDown,
  Clock,
  CreditCard,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";


const MEMBERSHIP_TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    badge: null,
    highlight: false,
    label: null,
    icon: Zap,
    gradient: "from-gray-50 to-gray-100",
    borderColor: "border-gray-200",
    iconColor: "text-gray-500",
    buttonVariant: "outline" as const,
    buttonText: "Get Started Free",
    features: [
      "Basic marketplace access",
      "Up to 25 active listings",
      "5% platform fee on sales",
      "Basic trade matching",
      "Collection tracker (up to 500 cards)",
      "Community reviews",
      "Trust Score tracking",
      "Basic dispute support",
      "Standard support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    badge: "Most Popular",
    highlight: true,
    label: null,
    icon: Crown,
    gradient: "from-red-50 to-orange-50",
    borderColor: "border-red-300",
    iconColor: "text-red-500",
    buttonVariant: "default" as const,
    buttonText: "Join Today",
    features: [
      "Everything in Free, plus:",
      "Unlimited listings",
      "3% platform fee (save 40%)",
      "Priority trade matching",
      "Unlimited collection tracking",
      "Portfolio analytics & price alerts",
      "Enhanced Protection Program (up to $100 discretionary credit)",
      "Priority dispute review",
      "Pro badge on profile",
      "Advanced search filters",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 19.99,
    badge: null,
    highlight: false,
    label: "Best Value",
    icon: Shield,
    gradient: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-300",
    iconColor: "text-blue-500",
    buttonVariant: "default" as const,
    buttonText: "Join Today",
    features: [
      "Everything in Pro, plus:",
      "3% platform fee",
      "Elite Protection Program (up to $250 discretionary credit)",
      "Dedicated support channel",
      "Early access to new features",
      "Elite badge on profile",
      "Collection insurance referral priority",
      "Advanced portfolio analytics",
      "Bulk listing tools",
      "Trade history export",
    ],
  },
] as const;

const FAQS = [
  {
    q: "Can I switch between plans anytime?",
    a: "Yes! You can upgrade or downgrade your membership at any time. When upgrading, you get immediate access to new features. When downgrading, your current benefits remain active until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover. All payments are processed securely.",
  },
  {
    q: "How does the Protection Program work?",
    a: "The Protection Program provides discretionary credits if something goes wrong with a trade or purchase. Pro members are eligible for up to $100, and Elite members up to $250. Each case is reviewed individually by our team. This is not insurance — it's our commitment to building trust on the platform.",
  },
  {
    q: "What happens to my listings if I downgrade?",
    a: "If you downgrade from Pro/Elite to Free, your existing listings remain active. However, once you exceed the 25-listing limit on the Free tier, you won't be able to create new listings until you're back under the limit.",
  },
  {
    q: "Is there a free trial for Pro or Elite?",
    a: "We don't offer a free trial, but our Free tier gives you full access to core trading and marketplace features. You can upgrade whenever you're ready — and cancel anytime if it's not for you.",
  },
  {
    q: "How do platform fees work?",
    a: "Platform fees only apply to completed marketplace sales — not trades. Free members pay 5%, while Pro and Elite members pay just 3%. There are no fees on trades between users.",
  },
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-blue-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-red-100/40 to-blue-100/40 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Star className="h-3.5 w-3.5 mr-1.5 fill-yellow-400 text-yellow-400" />
              Membership Plans
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Join the{" "}
              <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                Poké-Trade
              </span>{" "}
              Community
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              The trusted marketplace for Pokémon card collectors and traders.
              Buy, sell, and trade with confidence — backed by our Trust Score
              system and Protection Program.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="relative -mt-4 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {MEMBERSHIP_TIERS.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={tier.highlight ? "md:-mt-4 md:mb-[-16px]" : ""}
                >
                  <Card
                    className={`h-full relative overflow-hidden ${
                      tier.highlight
                        ? "border-2 border-red-400 shadow-xl shadow-red-100/50 ring-1 ring-red-200"
                        : `border ${tier.borderColor}`
                    }`}
                  >
                    {tier.badge && (
                      <div className="absolute -top-0 left-0 right-0">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-center text-xs font-bold py-1.5 tracking-wide uppercase">
                          {tier.badge}
                        </div>
                      </div>
                    )}
                    {tier.label && (
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 text-xs"
                        >
                          {tier.label}
                        </Badge>
                      </div>
                    )}
                    <CardContent
                      className={`${tier.badge ? "pt-12" : "pt-8"} pb-8`}
                    >
                      <div
                        className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${tier.gradient} mb-4`}
                      >
                        <Icon className={`h-6 w-6 ${tier.iconColor}`} />
                      </div>
                      <h3 className="text-2xl font-bold">{tier.name}</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-5xl font-bold tracking-tight">
                          {tier.price === 0 ? "Free" : `$${tier.price}`}
                        </span>
                        {tier.price > 0 && (
                          <span className="text-base text-muted-foreground">
                            /mo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tier.price === 0
                          ? "No credit card required"
                          : "Billed monthly · Cancel anytime"}
                      </p>

                      <div className="my-6 h-px bg-gray-100" />

                      <ul className="space-y-3">
                        {tier.features.map((feature) => {
                          const isHeader = feature.endsWith(":");
                          return (
                            <li
                              key={feature}
                              className={`flex items-start gap-3 text-sm ${
                                isHeader
                                  ? "font-semibold text-gray-900 pt-1"
                                  : ""
                              }`}
                            >
                              {!isHeader && (
                                <div
                                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                    tier.highlight
                                      ? "bg-red-100"
                                      : tier.id === "elite"
                                        ? "bg-blue-100"
                                        : "bg-gray-100"
                                  }`}
                                >
                                  <Check
                                    className={`h-3 w-3 ${
                                      tier.highlight
                                        ? "text-red-600"
                                        : tier.id === "elite"
                                          ? "text-blue-600"
                                          : "text-gray-600"
                                    }`}
                                  />
                                </div>
                              )}
                              <span>{feature}</span>
                            </li>
                          );
                        })}
                      </ul>

                      <Button
                        className={`w-full mt-8 ${
                          tier.highlight
                            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200/50"
                            : tier.id === "elite"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-200/50"
                              : ""
                        }`}
                        variant={tier.buttonVariant}
                        size="lg"
                        asChild
                      >
                        <Link href="/register">{tier.buttonText}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {[
              { icon: RefreshCcw, text: "Cancel anytime" },
              { icon: CreditCard, text: "No long-term contracts" },
              { icon: Clock, text: "Instant access" },
            ].map(({ icon: TrustIcon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrustIcon className="h-4 w-4 text-green-500" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              Frequently Asked{" "}
              <span className="text-primary">Questions</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about Poké-Trade membership.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <Button variant="outline" asChild>
              <Link href="/help">Visit our Help Center</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="border-t pt-8">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Protection Program benefits are discretionary and subject to
              review. Not insurance. Platform fees apply to completed
              marketplace sales only. Prices shown in USD. Features and
              benefits subject to our{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
        >
          <span className="font-semibold text-sm pr-4">{question}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}
