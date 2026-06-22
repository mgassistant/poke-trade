"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 border-t border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-secondary/10" />
          <div className="absolute inset-0 bg-card/70 backdrop-blur-sm" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />

          <div className="relative z-10 text-center py-20 px-6">
            <Image
              src="/logo.png"
              alt="Poké-Trade"
              width={200}
              height={60}
              className="h-16 w-auto mx-auto mb-8 drop-shadow-[0_0_20px_rgba(0,212,255,0.2)]"
            />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Ready to Start{" "}
              <span className="text-primary">Trading</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
              Join thousands of Pokémon card collectors. Create your free account in 30 seconds.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="gradient" className="text-base px-10" asChild>
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="text-base" asChild>
                <Link href="/marketplace">Explore Marketplace</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground/60">
              No credit card required · Free forever plan · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
