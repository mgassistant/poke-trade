"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TRADER_LEVELS } from "@/lib/constants";

export function ReputationSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1.5 bg-yellow-50 text-yellow-700 border-yellow-200">
            <Trophy className="h-3.5 w-3.5 mr-1.5" />
            Trusted Trader Program
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Rise Through the <span className="text-blue-700">Ranks</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Build your reputation with every successful trade. Earn badges, unlock perks, and become a trusted Pokémon Master.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRADER_LEVELS.map((level, i) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="text-center h-full hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <CardContent className="pt-6 pb-5">
                  <div className="text-4xl mb-3">{level.icon}</div>
                  <h3 className="font-semibold text-sm text-gray-900">{level.name}</h3>
                  <p className="text-xs text-gray-500 mt-1.5">{level.minTrades}+ trades</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
