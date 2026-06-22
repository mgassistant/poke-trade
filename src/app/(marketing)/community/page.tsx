"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ArrowRight, MessageCircle, Heart, Award, Share2, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const SAMPLE_FEED = [
  { user: "Alex K.", avatar: "🔥", action: "completed a trade", detail: "Charizard VMAX ↔ Umbreon VMAX Alt Art", time: "2 hours ago", type: "trade" },
  { user: "Sarah M.", avatar: "💎", action: "added to collection", detail: "PSA 10 Gold Star Rayquaza — $2,400", time: "3 hours ago", type: "collection" },
  { user: "James R.", avatar: "⚡", action: "listed for sale", detail: "Pikachu Illustrator Promo — $8,500", time: "5 hours ago", type: "listing" },
  { user: "Luna T.", avatar: "🌙", action: "hit Gym Leader rank!", detail: "50+ successful trades completed", time: "6 hours ago", type: "achievement" },
  { user: "Marcus D.", avatar: "🏆", action: "new pull!", detail: "Special Illustration Rare Charizard ex", time: "8 hours ago", type: "pull" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Community
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Connect with{" "}
            <span className="text-secondary">Collectors</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your pulls, showcase your collection, follow top traders, and be part of the most passionate Pokémon card community on the internet.
          </p>
          <Button size="xl" variant="gradient" className="mt-10" asChild>
            <Link href="/register">
              Join the Community
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Activity Feed Preview */}
      <section className="py-20 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Live <span className="text-primary">Activity Feed</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                See what the community is up to — trades, pulls, listings, and achievements in real-time.
              </p>
              <div className="space-y-3">
                {SAMPLE_FEED.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="hover:border-border transition-colors">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                          {item.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{item.user}</span>{" "}
                            <span className="text-muted-foreground">{item.action}</span>
                          </p>
                          <p className="text-xs text-primary mt-0.5 truncate">{item.detail}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{item.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Community features */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-4">
                Community <span className="text-secondary">Features</span>
              </h2>
              {[
                { icon: <Share2 className="h-5 w-5" />, title: "Activity Feed", desc: "Post new pulls, collection updates, and trade completions. Like and comment on community posts." },
                { icon: <Heart className="h-5 w-5" />, title: "Follow Traders", desc: "Follow your favorite traders and collectors. Get updates when they list new cards or make trades." },
                { icon: <MessageCircle className="h-5 w-5" />, title: "Private Messages", desc: "Message any trader directly. Negotiate deals, discuss trades, or just chat about cards." },
                { icon: <Sparkles className="h-5 w-5" />, title: "Collection Showcases", desc: "Display your best cards, show off collection goals, and browse other collectors' showcases." },
                { icon: <Award className="h-5 w-5" />, title: "Achievements", desc: "Earn badges for trades, collection milestones, and community participation." },
                { icon: <Bell className="h-5 w-5" />, title: "Notifications", desc: "Get notified about trade matches, messages, follows, and market price changes." },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="hover:border-secondary/20 transition-all">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Your Tribe is <span className="text-secondary">Here</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of Pokémon card collectors and traders. Free forever.
          </p>
          <Button size="xl" variant="gradient" asChild>
            <Link href="/register">
              Join Poké-Trade
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
