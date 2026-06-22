"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-blue-700" />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.3) 32%, transparent 32%)`,
              backgroundSize: "80px 80px",
            }}
          />

          <div className="relative z-10 text-center py-20 px-6">
            <Image
              src="/logo.png"
              alt="Poké-Trade"
              width={200}
              height={60}
              className="h-16 w-auto mx-auto mb-8 drop-shadow-lg"
            />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Ready to Start{" "}
              <span className="text-yellow-300">Trading</span>?
            </h2>
            <p className="mt-4 text-white/85 max-w-lg mx-auto text-lg">
              Join thousands of Pokémon card collectors. Create your free account in 30 seconds.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" className="text-base px-10 bg-white text-red-600 hover:bg-gray-100 font-semibold shadow-lg" asChild>
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="text-base border-white/40 text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/marketplace">Explore Marketplace</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-white/60">
              No credit card required · Free forever plan · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
