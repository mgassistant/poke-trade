"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-b from-[#131c33] to-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-[#1e293b] to-blue-600/10" />
          <div className="absolute inset-0 bg-white/[0.02]" />

          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[100px]" />

          <div className="relative z-10 text-center py-20 px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Ready to Start{" "}
              <span className="text-red-500">Trading</span>?
            </h2>
            <p className="mt-4 text-slate-300 max-w-lg mx-auto text-lg">
              Join thousands of collectors on Poké-Trade. Create your free
              account in 30 seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-600/25 text-base"
              >
                Start Trading
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/15 text-white hover:bg-white/5 font-semibold rounded-lg transition-all duration-200 text-base"
              >
                Browse Marketplace
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              No credit card required · Free forever plan · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
