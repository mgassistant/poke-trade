"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle, ChevronDown, ChevronUp, Rocket, ArrowLeftRight,
  ShoppingCart, Shield, Truck, CreditCard, Mail
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FAQ_SECTIONS = [
  {
    title: "Getting Started",
    icon: <Rocket className="h-5 w-5" />,
    items: [
      {
        q: "How do I create a Poké-Trade account?",
        a: "Click \"Sign Up\" and register with your email. You'll need to verify your email address before you can start trading. For higher trade limits, complete phone and ID verification from your profile settings.",
      },
      {
        q: "Is Poké-Trade free to use?",
        a: "Creating an account, browsing listings, and building your collection tracker are completely free. We only charge a small fee when you sell a card through the marketplace. Trading between users is free.",
      },
      {
        q: "What Pokémon cards can I list?",
        a: "You can list any authentic Pokémon TCG card — vintage, modern, graded, or raw. We support English and Japanese cards. Counterfeit or proxy cards are strictly prohibited.",
      },
      {
        q: "How do I set up my profile?",
        a: "Go to your profile settings to add a bio, profile picture, and your collection details. The more complete your profile, the more trust you'll build with other traders. Completing verification levels unlocks higher trade limits.",
      },
      {
        q: "Can I use Poké-Trade on mobile?",
        a: "Yes! Poké-Trade is fully responsive and works great on mobile browsers. A dedicated mobile app is on our roadmap for future release.",
      },
    ],
  },
  {
    title: "Trading",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    items: [
      {
        q: "How does trading work?",
        a: "Browse listings and send a trade offer to another user. You can propose card-for-card swaps or include cash to balance the deal. Both parties must accept before the trade is confirmed.",
      },
      {
        q: "What if my trade partner doesn't ship?",
        a: "If a trade is confirmed but the other party doesn't ship within 5 business days, you can open a dispute. Our Trust & Safety team will review and take action, which may include account suspension for the non-shipping party.",
      },
      {
        q: "Can I cancel a trade after accepting?",
        a: "You can cancel within 1 hour of accepting if the other party hasn't shipped yet. After that, cancellation requires mutual agreement or a dispute resolution through our team.",
      },
      {
        q: "How are card values determined for trades?",
        a: "We pull real-time market data from TCGPlayer and other sources. You'll see estimated market values on every card to help negotiate fair trades. Final trade terms are always agreed upon by both parties.",
      },
    ],
  },
  {
    title: "Buying & Selling",
    icon: <ShoppingCart className="h-5 w-5" />,
    items: [
      {
        q: "How do I list a card for sale?",
        a: "Click \"Create Listing,\" upload front and back photos of your card, set your price, and add details like condition, set, and any grading info. Cards over $50 require both front and back photos.",
      },
      {
        q: "What fees does Poké-Trade charge sellers?",
        a: "We charge a small marketplace fee on completed sales. The exact percentage depends on your verification level and seller tier. There are no listing fees — you only pay when a sale completes.",
      },
      {
        q: "How does buyer protection work?",
        a: "All marketplace purchases go through a secure payment hold. The seller doesn't receive payment until you confirm receipt and the 48-hour inspection window passes. If the card doesn't match the listing, you can open a dispute.",
      },
      {
        q: "Can I make offers on listings?",
        a: "Yes! Most listings accept offers. Click \"Make Offer\" on any eligible listing and propose your price. The seller can accept, counter, or decline.",
      },
      {
        q: "How do refunds work?",
        a: "If a dispute is resolved in the buyer's favor, funds are returned from the secure payment hold. For accepted returns, the buyer ships the card back and the refund is processed once the seller confirms receipt.",
      },
    ],
  },
  {
    title: "Account & Security",
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        q: "How do I verify my account?",
        a: "Go to Settings → Verification. You can verify your email (required), phone number (SMS code), and government ID (via Stripe Identity). Each level unlocks higher trade limits and more features.",
      },
      {
        q: "What if I forget my password?",
        a: "Click \"Forgot Password\" on the login page and enter your email. You'll receive a reset link. If you don't see it, check your spam folder or contact support@poke-trade.com.",
      },
      {
        q: "Can I change my username?",
        a: "You can change your display name anytime from profile settings. Your unique username can be changed once every 30 days. Previous usernames are reserved for 90 days to prevent impersonation.",
      },
      {
        q: "How do I enable two-factor authentication?",
        a: "Go to Settings → Security → Two-Factor Authentication. We support authenticator apps (Google Authenticator, Authy) and SMS codes. We strongly recommend enabling 2FA to protect your account.",
      },
    ],
  },
  {
    title: "Shipping",
    icon: <Truck className="h-5 w-5" />,
    items: [
      {
        q: "How should I ship Pokémon cards?",
        a: "Always use penny sleeves and toploaders. For valuable cards, use bubble mailers with tracking. Check our Shipping Guide for detailed packaging instructions to keep cards safe in transit.",
      },
      {
        q: "Is tracking required?",
        a: "Tracking is required for all trades and sales over $25. For items under $25, tracking is optional but strongly recommended. Without tracking, you can't prove delivery in a dispute.",
      },
      {
        q: "Do you support international shipping?",
        a: "Yes! International trades and sales are supported. Be aware of longer shipping times, customs fees, and higher shipping costs. We recommend registered international mail for tracking.",
      },
      {
        q: "What if my card arrives damaged?",
        a: "Document the damage with photos immediately upon opening. Open a dispute within the 48-hour inspection window and upload your evidence. Our team will review and determine the resolution.",
      },
      {
        q: "Who pays for shipping?",
        a: "For sales, the seller typically covers shipping (factored into the listing price). For trades, both parties ship their own cards. Shipping costs and methods should be agreed upon before confirming.",
      },
    ],
  },
  {
    title: "Payments",
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We process payments through Stripe, supporting all major credit/debit cards, Apple Pay, and Google Pay. For payouts, sellers can connect their bank account or use Stripe Express.",
      },
      {
        q: "When do sellers get paid?",
        a: "Sellers receive payment after the buyer confirms receipt and the 48-hour inspection window closes. If no dispute is filed, funds auto-release. Payouts typically arrive in 2-3 business days.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No hidden fees. Our marketplace fee is clearly shown before you confirm any sale. Stripe payment processing fees are standard. There are no listing fees, monthly fees, or subscription charges.",
      },
      {
        q: "Can I get a refund on a purchase?",
        a: "If you receive a card that doesn't match the listing description, open a dispute within 48 hours of delivery. If resolved in your favor, you'll receive a full refund to your original payment method.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-sm text-foreground">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </div>
      {open && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </button>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Help Center
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            How Can We <span className="text-primary">Help?</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions about trading, buying, selling, and shipping Pokémon cards on Poké-Trade.
          </p>
        </div>

        <div className="space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card className="mt-16">
          <CardContent className="p-8 text-center">
            <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Still Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <a
              href="mailto:support@poke-trade.com"
              className="text-primary hover:underline font-medium"
            >
              support@poke-trade.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
