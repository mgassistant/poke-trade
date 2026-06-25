"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package, RefreshCw, Bug, Lightbulb, User, CreditCard,
  ArrowRight, Headphones
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/support/FAQAccordion";

const quickLinks = [
  { icon: <Package className="h-6 w-6" />, label: "Order Issues", href: "/contact?category=order_issue", color: "bg-blue-50 text-blue-600" },
  { icon: <RefreshCw className="h-6 w-6" />, label: "Trade Disputes", href: "/contact?category=trade_dispute", color: "bg-purple-50 text-purple-600" },
  { icon: <Bug className="h-6 w-6" />, label: "Report a Bug", href: "/contact?category=bug_report", color: "bg-red-50 text-red-600" },
  { icon: <Lightbulb className="h-6 w-6" />, label: "Feature Request", href: "/contact?category=feature_request", color: "bg-yellow-50 text-yellow-700" },
  { icon: <User className="h-6 w-6" />, label: "Account Help", href: "/contact?category=account", color: "bg-green-50 text-green-600" },
  { icon: <CreditCard className="h-6 w-6" />, label: "Billing", href: "/contact?category=billing", color: "bg-orange-50 text-orange-600" },
];

const faqItems = [
  { question: "How do I create an account?", answer: "Click \"Sign Up\" on the top right corner, enter your email and create a password. Verify your email to get started. You can then complete your profile and start browsing the marketplace." },
  { question: "How does trading work?", answer: "Browse listings and send a trade offer to another user. You can propose card-for-card swaps or include cash to balance the deal. Both parties must accept before the trade is confirmed. Once confirmed, both parties ship their cards within 5 business days." },
  { question: "What are the membership tiers?", answer: "We offer Free, Pro ($19.99/mo), and Elite ($39.99/mo) tiers. Free includes 10 P2P trades/month and basic features. Pro adds unlimited trades, drop alerts, and 3% seller fees. Elite includes everything in Pro plus priority alerts, portfolio analytics, and dedicated support." },
  { question: "How do I list a card for sale?", answer: "Click \"Create Listing\" from your dashboard, upload front and back photos of your card, set your price, and add details like condition, set, and grading info. Cards over $50 require both front and back photos." },
  { question: "What payment methods are accepted?", answer: "We accept all major credit and debit cards through Stripe. For trade balance payments, you can use your Poké-Trade wallet. We do not accept cryptocurrency, PayPal, or cash payments at this time." },
  { question: "How does the Trust Score work?", answer: "Your Trust Score (0-100) is calculated based on trade history, verification level, response time, dispute rate, and community feedback. Higher scores unlock higher trade limits and build confidence with other traders." },
  { question: "What is Trade Protection?", answer: "Trade Protection is our secure payment hold system. When you buy a card, payment is held until you confirm receipt and the 48-hour inspection window passes. If the card doesn't match the listing, you can open a dispute for a full refund." },
  { question: "How do I report a scam?", answer: "Click \"Report\" on the user's profile or listing page. You can also go to /report to file a detailed report. Our Trust & Safety team reviews all reports within 24 hours and takes action including account suspension for confirmed violations." },
  { question: "How do refunds work?", answer: "If a buyer opens a dispute within the inspection window and the dispute is resolved in their favor, a full refund is issued to their original payment method. Refunds typically process within 5-10 business days." },
  { question: "How do I verify my identity?", answer: "Go to Dashboard → Settings → Verification. We offer three levels: Email verification (Level 1), Phone verification (Level 2), and Government ID verification (Level 3). Higher levels unlock higher trade limits." },
  { question: "What are drop alerts?", answer: "Drop alerts notify you instantly when new or limited-edition Pokémon products drop at major retailers. Pro members get standard alerts; Elite members get 30-second faster priority alerts. We monitor 7+ major retailers." },
  { question: "How do purchase limits work?", answer: "Purchase limits are based on your verification level and Trust Score. New accounts start with lower limits that increase as you verify your identity and build trading history. Pro and Elite members get higher default limits." },
  { question: "Can I cancel an order?", answer: "Buyers can request cancellation before the seller ships. Once shipped, cancellation requires the seller's agreement or a dispute. Sellers can cancel before shipping, though frequent cancellations may affect their Trust Score." },
  { question: "How do I contact support?", answer: "Visit our Contact page at /contact to submit a support ticket. You can also email us at support@poke-trade.com. We typically respond within 24 hours during business days." },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5">
            <Headphones className="h-7 w-7" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Support <span className="text-red-600">Center</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers or get help from our team
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-16">
          {quickLinks.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="pt-5 pb-5 text-center">
                    <div className={`h-12 w-12 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      {item.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                      {item.label}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <FAQAccordion items={faqItems} />
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gray-50 rounded-2xl border border-gray-200 py-12 px-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Still need help?</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is ready to assist you.
          </p>
          <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
            <Link href="/contact">
              Contact Support <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
