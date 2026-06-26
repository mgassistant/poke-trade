"use client";

import { memo } from "react";
import { Shield, UserCheck, Lock, AlertTriangle, BarChart3, FileCheck } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const benefits = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Trust Score System",
    description:
      "Every trader earns a reputation score. See ratings, trade history, and verification status before you trade.",
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: "Identity Verification",
    description:
      "Verified traders go through ID checks. Know who you're trading with — no anonymous accounts.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Trade Protection",
    description:
      "Secure payment holds, shipping verification, and dispute resolution protect every transaction.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Fraud Prevention",
    description:
      "AI-powered fraud detection, counterfeit screening, and community reporting keep the platform safe.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Collection Tracker",
    description:
      "Track your entire collection with real-time market pricing, portfolio analytics, and set completion.",
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    title: "Insurance Referral",
    description:
      "Protect high-value collections with insurance referrals through our licensed partner network.",
  },
];

export const BenefitsSection = memo(function BenefitsSection() {
  const ref = useReveal();

  return (
    <section ref={ref} className="py-24 bg-gray-50 reveal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Why <span className="text-red-600">Poké-Trade</span>?
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Built from the ground up for security, transparency, and the
            collector community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit) => (
            <div key={benefit.title}>
              <div className="glass-card rounded-xl p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-100 transition-all">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-base text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
