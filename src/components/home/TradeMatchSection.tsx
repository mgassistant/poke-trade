"use client";

import { motion } from "framer-motion";
import { Search, Scale, CheckCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    icon: <Search className="h-6 w-6 text-red-600" />,
    title: "Browse & Collect",
    description: "Add cards you own and mark which ones are available for trade. Build your want list of cards you're looking for.",
  },
  {
    step: "02",
    icon: <Scale className="h-6 w-6 text-red-600" />,
    title: "Propose a Trade",
    description: "Our engine scans thousands of collections to find mutual trade opportunities — users who have what you want and want what you have.",
  },
  {
    step: "03",
    icon: <CheckCircle className="h-6 w-6 text-red-600" />,
    title: "Ship & Verify",
    description: "Send offers, negotiate fair trades, ship cards with tracking, and earn reputation with every successful trade.",
  },
];

export function TradeMatchSection() {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1.5 bg-red-50 text-red-600 border-red-200">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Find Your Perfect Trade in <span className="text-red-600">Seconds</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Stop scrolling through forums. Our smart matching engine finds mutual trade opportunities automatically.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Card className="relative h-full hover:border-red-200 transition-all duration-300 group hover:-translate-y-1 hover:shadow-md">
                <CardContent className="pt-8 pb-6">
                  <span className="text-6xl font-bold text-gray-100 absolute top-4 right-5 group-hover:text-red-50 transition-colors">
                    {item.step}
                  </span>
                  <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Connection arrows */}
        <div className="hidden md:flex justify-center mt-8 gap-4 items-center text-gray-300">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-red-200" />
          <ArrowRight className="h-4 w-4 text-red-300" />
          <div className="h-px w-20 bg-red-200" />
          <ArrowRight className="h-4 w-4 text-red-300" />
          <div className="h-px w-20 bg-gradient-to-r from-red-200 to-transparent" />
        </div>
      </div>
    </section>
  );
}
