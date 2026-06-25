"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "./StarRating";
import { useUser } from "@/lib/hooks/useUser";

const FEEDBACK_TYPES = [
  { value: "suggestion", label: "Suggestion" },
  { value: "compliment", label: "Compliment" },
  { value: "complaint", label: "Complaint" },
  { value: "general", label: "General" },
];

export function FeedbackForm() {
  const { user, profile } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "general",
    rating: null as number | null,
    message: "",
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: profile?.display_name || profile?.username || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          page_url: window.location.href,
        }),
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            Your feedback helps us build a better platform for everyone.
          </p>
          <Button
            className="mt-6 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              setSubmitted(false);
              setForm({ name: "", email: "", type: "general", rating: null, message: "" });
            }}
          >
            Submit More Feedback
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name {!user && "(optional)"}
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email {!user && "(optional)"}
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            >
              {FEEDBACK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rating (optional)
            </label>
            <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Share your thoughts, suggestions, or feedback..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none"
            />
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
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
