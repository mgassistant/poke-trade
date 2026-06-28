"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield, Lock, CheckCircle, ShieldCheck, Flame, Droplets,
  CloudLightning, Truck, MapPin, Briefcase, Plane, Box,
  Camera, FileText, Download, BarChart3, Hash, Layers,
  ClipboardList, History, Star, Award, Zap, Building2,
  Store, Package, Umbrella, Warehouse, Search, Scale,
  Users, Crown, ArrowRight, ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VALUE_RANGES = [
  "Under $5,000",
  "$5,000 – $25,000",
  "$25,000 – $100,000",
  "$100,000 – $500,000",
  "$500,000+",
];

const COLLECTION_TYPES = [
  "Pokémon TCG",
  "Sports Cards",
  "Comics",
  "Sealed Products",
  "Graded Cards",
  "Other",
];

const STORAGE_METHODS = [
  { value: "home", label: "Home" },
  { value: "safe", label: "Home Safe" },
  { value: "bank_vault", label: "Bank Vault" },
  { value: "storage_unit", label: "Storage Unit" },
  { value: "other", label: "Other" },
];

const CURRENT_INSURANCE = [
  "None",
  "Homeowners",
  "Renters",
  "Specialized Collectibles",
  "Other",
];

const portfolioFeatures = [
  { icon: ClipboardList, label: "Collection inventory" },
  { icon: BarChart3, label: "Current market estimates" },
  { icon: Award, label: "Graded cards" },
  { icon: History, label: "Purchase history" },
  { icon: Camera, label: "Photos" },
  { icon: Hash, label: "Serial numbers" },
  { icon: ShieldCheck, label: "PSA/CGC/BGS certification numbers" },
  { icon: Layers, label: "Collection categories" },
  { icon: Box, label: "Sealed products" },
  { icon: Star, label: "Trade history" },
];

const coverageTypes = [
  { icon: Lock, label: "Theft", desc: "Protection against stolen items" },
  { icon: Flame, label: "Fire", desc: "Coverage for fire damage" },
  { icon: Droplets, label: "Water Damage", desc: "Flood & water protection" },
  { icon: CloudLightning, label: "Natural Disasters", desc: "Storm, earthquake coverage" },
  { icon: Shield, label: "Accidental Damage", desc: "Drops, spills, mishandling" },
  { icon: Truck, label: "Shipping / Transit", desc: "In-transit protection" },
  { icon: MapPin, label: "Shows & Events", desc: "Convention coverage" },
  { icon: Plane, label: "Travel", desc: "Coverage while traveling" },
];

const roadmapItems = [
  { icon: Shield, label: "Collection Protection", active: true },
  { icon: Store, label: "Card Shop Protection", active: false },
  { icon: ShieldCheck, label: "Marketplace Seller Protection", active: false },
  { icon: Users, label: "Convention Vendor", active: false },
  { icon: Truck, label: "Shipping Protection", active: false },
  { icon: Warehouse, label: "Vault Storage", active: false },
  { icon: Search, label: "Authentication Partnerships", active: false },
  { icon: FileText, label: "Scheduled Articles", active: false },
  { icon: Building2, label: "Business Protection", active: false },
  { icon: Building2, label: "Commercial Property", active: false },
  { icon: Package, label: "Inland Marine", active: false },
  { icon: Scale, label: "General Liability", active: false },
  { icon: MapPin, label: "Event Coverage", active: false },
  { icon: Crown, label: "High Net Worth", active: false },
];

export default function CollectorsProtectPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    estimated_value: "",
    collection_types: [] as string[],
    storage_method: "",
    has_portfolio: false,
    consent_portfolio: false,
    current_coverage: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const toggleCollectionType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      collection_types: prev.collection_types.includes(type)
        ? prev.collection_types.filter((t) => t !== type)
        : [...prev.collection_types, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/protect/collector-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          estimated_collection_value: formData.estimated_value,
          collection_types: formData.collection_types,
          storage_method: formData.storage_method || null,
          has_verified_portfolio: formData.has_portfolio,
          consent_portfolio_share: formData.has_portfolio && formData.consent_portfolio,
          current_coverage: formData.current_coverage || null,
          message: formData.message || null,
          consent_to_contact: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2044] to-[#162d5a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.08),transparent_50%)]" />

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 opacity-10">
          <Shield className="h-64 w-64 text-blue-300" />
        </div>
        <div className="absolute bottom-10 left-10 opacity-5">
          <Lock className="h-40 w-40 text-yellow-300" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <Shield className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-blue-100 font-medium">Collectible Portfolio Protection</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Protect What You&apos;ve Worked{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              So Hard to Build.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
            Get connected with licensed protection partners offering coverage options designed for
            trading card collections, graded cards, sealed products, sports cards, comics, and other
            eligible collectibles. Poké-Trade members may qualify for exclusive member pricing and
            partner discounts not available to the general public.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#quote-form"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 text-lg"
            >
              <Shield className="h-5 w-5" />
              Get My Protection Quote
            </a>
            <Link
              href="/dashboard/collection"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-xl transition-all border border-white/15 text-lg"
            >
              Build My Verified Portfolio
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-blue-200/60">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Licensed Partners
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Member Discounts
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Verified Portfolios
            </div>
          </div>
        </div>
      </section>

      {/* Poké-Trade Advantage */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
              The Poké-Trade Advantage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Built for Collectors.{" "}
              <span className="text-blue-600">Designed to Make Protection Easier.</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Your verified Poké-Trade portfolio documents everything protection partners need.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {portfolioFeatures.map((f) => (
              <div
                key={f.label}
                className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 mb-3">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-700">
              This verified portfolio can help streamline the quote process by providing organized
              documentation to participating protection partners. Final valuation, underwriting
              decisions, and coverage remain the responsibility of the licensed protection provider.
            </p>
          </div>
        </div>
      </section>

      {/* Member Benefits */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 mb-4">
              Member Benefits
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              More Value at Every Level
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Free</h3>
              <p className="text-sm text-gray-500 mb-6">Get started with protection quotes</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Access to protection quote requests
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Basic portfolio documentation
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Coverage information & education
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border-2 border-blue-300 p-8 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white border-0 shadow-md">POPULAR</Badge>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
              <p className="text-sm text-gray-500 mb-6">Preferred pricing & priority service</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  Preferred partner pricing
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  Member-only offers & discounts
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  Priority quote processing
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  Enhanced portfolio tools
                </li>
              </ul>
            </div>

            {/* Elite */}
            <div className="bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border border-amber-200 p-8 hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Elite</h3>
              <p className="text-sm text-gray-500 mb-6">Best pricing & concierge service</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Best member pricing available
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Priority service & dedicated support
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Premium portfolio & valuation tools
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Concierge assistance
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  Early access to new features
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">
              Member benefits, pricing, discounts, and offers vary by participating protection
              provider, state, eligibility, underwriting approval, and policy type.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Portfolio Integration */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-green-50 text-green-700 border-green-200 mb-4">
              Portfolio Integration
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Your Collection, Fully Documented
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              A verified Poké-Trade portfolio gives protection partners the organized documentation they need.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden mb-12">
            <div className="bg-gradient-to-r from-[#0f2044] to-[#1a3a6a] p-6">
              <h3 className="text-white font-bold text-lg">Portfolio Summary</h3>
              <p className="text-blue-200 text-sm">Protection-ready documentation</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: "Estimated Value", value: "$47,250", color: "text-green-600" },
                  { label: "Total Cards", value: "1,847", color: "text-blue-600" },
                  { label: "Graded Cards", value: "124", color: "text-purple-600" },
                  { label: "Sealed Value", value: "$8,400", color: "text-amber-600" },
                  { label: "Market Trend", value: "+12.4%", color: "text-green-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Download, label: "Portfolio PDF Export", desc: "Download complete documentation" },
              { icon: FileText, label: "Protection Summary Report", desc: "Pre-formatted for insurers" },
              { icon: Camera, label: "Collection Photos", desc: "High-res photo documentation" },
              { icon: Hash, label: "Certification Numbers", desc: "PSA, CGC, BGS tracking" },
              { icon: ClipboardList, label: "Inventory Export", desc: "Spreadsheet-ready data" },
              { icon: BarChart3, label: "Market Tracking", desc: "Real-time valuation data" },
            ].map((f) => (
              <div key={f.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Future integrations */}
          <div className="mt-10 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-3">Future Integrations</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {["PSA", "CGC", "Beckett", "TCGplayer", "PriceCharting", "eBay Sold Data", "AI Valuation"].map((name) => (
                <span
                  key={name}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Information */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-red-50 text-red-700 border-red-200 mb-4">
              Coverage Types
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Comprehensive Protection Options
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coverageTypes.map((c) => (
              <div
                key={c.label}
                className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 mb-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                  <c.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{c.label}</h3>
                <p className="text-xs text-gray-500">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Available coverages vary by insurer and policy.
            </p>
          </div>
        </div>
      </section>

      {/* Homeowners vs. Collectibles Protection */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 mb-4">
              Compare Coverage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Homeowners vs. Collectibles Protection
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Homeowners */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Homeowners Coverage</h3>
                  <p className="text-xs text-gray-500">Standard home policy</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "May have high deductibles",
                  "May exclude certain collectibles",
                  "Valuation limitations may apply",
                  "Special sub-limits on valuables",
                  "Replacement cost vs. market value",
                  "May require separate riders",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="h-4 w-4 mt-0.5 shrink-0 text-gray-300">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Collectibles */}
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border-2 border-blue-300 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Collectibles Protection</h3>
                  <p className="text-xs text-blue-600 font-medium">Specialized coverage</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "May provide broader protection",
                  "Agreed value coverage options",
                  "Specialized for collectibles",
                  "Coverage for shows & transit",
                  "Market value considerations",
                  "Purpose-built for collectors",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-700">
              Coverage varies by insurer and policy. Consult with a licensed protection professional
              for personalized advice.
            </p>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote-form" className="py-20 sm:py-28 scroll-mt-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 mb-4">
              Get Protected
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Get Your Protection Quote
            </h2>
            <p className="mt-4 text-gray-500">
              Fill out the form below and a licensed protection specialist will contact you
              within 1–2 business days.
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                A licensed protection specialist will review your information and contact you within
                1–2 business days. Thank you for choosing Poké-Trade.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-6"
            >
              {/* Name / Email / Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Estimated Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Estimated Collection Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-colors"
                  >
                    <option value="">Select a range</option>
                    {VALUE_RANGES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Collection Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLLECTION_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCollectionType(type)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        formData.collection_types.includes(type)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {formData.collection_types.includes(type) && (
                        <CheckCircle className="h-3.5 w-3.5 inline mr-1.5" />
                      )}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Storage Method
                </label>
                <div className="relative">
                  <select
                    value={formData.storage_method}
                    onChange={(e) => setFormData({ ...formData, storage_method: e.target.value })}
                    className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-colors"
                  >
                    <option value="">Select storage method</option>
                    {STORAGE_METHODS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Verified Portfolio Toggle */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Do you have a verified Poké-Trade portfolio?
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        has_portfolio: !formData.has_portfolio,
                        consent_portfolio: false,
                      })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.has_portfolio ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        formData.has_portfolio ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </div>

                {formData.has_portfolio && (
                  <label className="flex items-start gap-3 bg-white rounded-lg border border-blue-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consent_portfolio}
                      onChange={(e) =>
                        setFormData({ ...formData, consent_portfolio: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      I consent to share my verified portfolio summary with participating protection
                      partners to streamline the quoting process.
                    </span>
                  </label>
                )}
              </div>

              {/* Current Coverage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Coverage
                </label>
                <div className="relative">
                  <select
                    value={formData.current_coverage}
                    onChange={(e) =>
                      setFormData({ ...formData, current_coverage: e.target.value })
                    }
                    className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-colors"
                  >
                    <option value="">Select current coverage</option>
                    {CURRENT_INSURANCE.map((ci) => (
                      <option key={ci} value={ci}>{ci}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors"
                  placeholder="Tell us about your collection, any special items, or questions..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || formData.collection_types.length === 0}
                className="w-full h-12 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {submitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Get My Protection Quote
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By submitting, you agree to be contacted by a licensed protection professional
                regarding your inquiry.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
              Roadmap
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Expanding Protection for Every Collector
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              We&apos;re building the most comprehensive protection marketplace for the collectibles industry.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {roadmapItems.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 text-center transition-all ${
                  item.active
                    ? "bg-blue-50 border-blue-300 shadow-sm"
                    : "bg-white border-gray-200 opacity-60"
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-lg mb-2 ${
                    item.active ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${item.active ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <p className={`text-xs font-medium ${item.active ? "text-blue-900" : "text-gray-500"}`}>
                  {item.label}
                </p>
                {item.active && (
                  <Badge className="mt-2 text-[9px] bg-green-100 text-green-700 border-green-200">
                    LIVE
                  </Badge>
                )}
                {!item.active && (
                  <span className="block mt-2 text-[9px] text-gray-400 font-medium">COMING SOON</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Disclosure */}
      <div className="bg-[#0a1628] border-t border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Important Disclosure:</strong> Poké-Trade is not a
              licensed protection agency, protection broker, or protection carrier. Protection products
              are offered exclusively through licensed third-party protection agencies, brokers, or
              protection companies. Coverage availability, premiums, discounts, eligibility, limits,
              deductibles, valuations, and policy terms vary by state and provider and are subject to
              underwriting approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
