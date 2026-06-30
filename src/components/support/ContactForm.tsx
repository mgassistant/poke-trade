"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/lib/hooks/useUser";

const CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "order_issue", label: "Order Issue" },
  { value: "account", label: "Account Help" },
  { value: "trade_dispute", label: "Trade Dispute" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const searchParams = useSearchParams();
  const { user, profile } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
    consent_calls: false,
    consent_sms: false,
    consent_email: false,
  });

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: profile?.display_name || profile?.username || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user, profile]);

  // Pre-fill category from URL
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && CATEGORIES.some(c => c.value === cat)) {
      setForm(prev => ({ ...prev, category: cat }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            We&apos;ve received your message and will get back to you within 24 hours.
          </p>
          <Button
            className="mt-6 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              setSubmitted(false);
              setForm({ name: "", email: "", category: "", subject: "", message: "" });
            }}
          >
            Send Another Message
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
            <Input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us more about your question or issue..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>

          {/* Communication Preferences — Required opt-in */}
          <div className="rounded-lg border border-gray-300 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Communication Preferences *</p>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent_calls}
                onChange={(e) => setForm({ ...form, consent_calls: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-red-600 rounded"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I agree to receive <strong>phone calls</strong> from Poké-Trade regarding my inquiry,
                order updates, and customer support (including autodialed and pre-recorded messages).
                Call frequency may vary.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent_sms}
                onChange={(e) => setForm({ ...form, consent_sms: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-red-600 rounded"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I agree to receive <strong>text messages</strong> from Poké-Trade regarding my inquiry,
                order updates, restock alerts, and customer support. Message frequency may vary.
                Message and data rates may apply. Reply STOP to opt out or HELP for assistance.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent_email}
                onChange={(e) => setForm({ ...form, consent_email: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-red-600 rounded"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I agree to receive <strong>emails</strong> from Poké-Trade regarding my inquiry,
                order updates, restock alerts, and promotions. You may unsubscribe at any time.
              </span>
            </label>

            <p className="text-[11px] text-red-600 leading-relaxed">
              Consent is not a condition of purchase. Your mobile information will not be shared with
              third parties or affiliates for marketing or promotional purposes.{" "}
              <a href="/sms-terms" className="text-red-700 underline hover:text-red-800">SMS Terms</a>
              {" · "}
              <a href="/privacy" className="text-red-700 underline hover:text-red-800">Privacy Policy</a>
            </p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
