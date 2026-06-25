"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquareHeart, Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackForm } from "@/components/support/FeedbackForm";
import { StarRating } from "@/components/support/StarRating";

interface Testimonial {
  id: string;
  name: string | null;
  message: string;
  rating: number | null;
  created_at: string;
}

export default function FeedbackPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/feedback?public=true")
      .then(r => r.json())
      .then(data => setTestimonials(data.feedback || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5">
            <MessageSquareHeart className="h-7 w-7" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Share Your <span className="text-red-600">Feedback</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Help us build the best trading platform for the Pokémon community
          </p>
        </div>

        {/* Form */}
        <Card className="mb-16">
          <CardContent className="pt-6">
            <FeedbackForm />
          </CardContent>
        </Card>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What Traders Are Saying
              </h2>
              <p className="text-gray-600">Real feedback from our community</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card>
                    <CardContent className="pt-5 pb-5">
                      <Quote className="h-5 w-5 text-red-300 mb-2" />
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {t.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          {t.name || "Anonymous"}
                        </span>
                        {t.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: t.rating }).map((_, j) => (
                              <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
