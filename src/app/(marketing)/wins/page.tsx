"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, Heart, MessageCircle, Share2, Flame, Star, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const SAMPLE_WINS = [
  {
    user: "Alex K.",
    avatar: "🔥",
    level: "Pokémon Master",
    type: "trade",
    title: "Completed a 5-card trade!",
    detail: "Traded my Charizard VMAX + 4 Alt Arts for a PSA 10 Umbreon VMAX Alt Art. Dream card acquired! 🌙",
    value: "$850 trade",
    likes: 47,
    comments: 12,
    time: "2 hours ago",
  },
  {
    user: "Sarah M.",
    avatar: "💎",
    level: "Elite Four",
    type: "purchase",
    title: "Found Prismatic Evolutions at Target!",
    detail: "Walked into Target this morning and found 3 ETBs on the shelf. Still in shock. Used Poké-Trade drop alerts! 🎯",
    value: "$54.99 each",
    likes: 93,
    comments: 28,
    time: "4 hours ago",
  },
  {
    user: "James R.",
    avatar: "⚡",
    level: "Gym Leader",
    type: "pull",
    title: "Pulled the Special Illustration Rare Charizard!",
    detail: "First pack of Chaos Rising and I pull the chase card. Already added to my collection tracker — $420 market value! 📈",
    value: "$420 card",
    likes: 156,
    comments: 43,
    time: "6 hours ago",
  },
  {
    user: "Luna T.",
    avatar: "🌙",
    level: "Gym Trainer",
    type: "milestone",
    title: "Collection hit $10,000! 💎",
    detail: "Started collecting 6 months ago with $500. Portfolio tracking on Poké-Trade has been a game changer for making smart buys.",
    value: "$10,000+ collection",
    likes: 72,
    comments: 19,
    time: "8 hours ago",
  },
  {
    user: "Marcus D.",
    avatar: "🏆",
    level: "Pokémon Trainer",
    type: "sale",
    title: "First sale on Poké-Trade!",
    detail: "Sold my spare Mew VMAX Rainbow for $95. Only 3% fee instead of 13% on eBay. That's $10 extra in my pocket! 💰",
    value: "$95 sale",
    likes: 34,
    comments: 8,
    time: "12 hours ago",
  },
  {
    user: "Diana P.",
    avatar: "✨",
    level: "Elite Four",
    type: "purchase",
    title: "Walmart Wednesday W! 🔥",
    detail: "Got the Mega Evolution Booster Bundle at Walmart for $21.99 thanks to the drop alert. Was gone in 3 minutes.",
    value: "$21.99 retail",
    likes: 61,
    comments: 15,
    time: "1 day ago",
  },
];

const WIN_TYPES = [
  { type: "all", label: "All Wins", icon: "🏆" },
  { type: "trade", label: "Trades", icon: "🔄" },
  { type: "pull", label: "Pulls", icon: "🎴" },
  { type: "purchase", label: "Retail Finds", icon: "🎯" },
  { type: "sale", label: "Sales", icon: "💰" },
  { type: "milestone", label: "Milestones", icon: "⭐" },
];

export default function WinsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-warning/10 text-warning border-warning/20">
            <Trophy className="h-3.5 w-3.5 mr-1.5" />
            Community Wins
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-warning">Wins</span> Feed
          </h1>
          <p className="mt-2 text-muted-foreground">
            Celebrate trades, pulls, retail finds, and collection milestones
          </p>
        </div>

        {/* Win type filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {WIN_TYPES.map((type) => (
            <button
              key={type.type}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                type.type === "all"
                  ? "bg-warning text-black"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Post button */}
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">🎴</div>
            <button className="flex-1 text-left text-sm text-muted-foreground bg-muted/30 rounded-full px-4 py-2.5 hover:bg-muted/50 transition-colors">
              Share your win...
            </button>
            <Button size="sm" className="bg-warning hover:bg-warning/90 text-black">Post</Button>
          </CardContent>
        </Card>

        {/* Wins Feed */}
        <div className="space-y-4">
          {SAMPLE_WINS.map((win, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="hover:border-warning/20 transition-colors">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {win.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{win.user}</span>
                        <Badge variant="outline" className="text-[9px] py-0">{win.level}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{win.time}</span>
                    </div>
                    <Badge className={`text-[10px] ${
                      win.type === "trade" ? "bg-secondary/20 text-secondary" :
                      win.type === "pull" ? "bg-primary/20 text-primary" :
                      win.type === "purchase" ? "bg-success/20 text-success" :
                      win.type === "sale" ? "bg-warning/20 text-warning" :
                      "bg-primary/20 text-primary"
                    }`}>
                      {win.type === "trade" ? "🔄 Trade" :
                       win.type === "pull" ? "🎴 Pull" :
                       win.type === "purchase" ? "🎯 Find" :
                       win.type === "sale" ? "💰 Sale" :
                       "⭐ Milestone"}
                    </Badge>
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-sm mb-1">{win.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{win.detail}</p>

                  {/* Value tag */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                      {win.value}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <button className="flex items-center gap-1.5 text-xs hover:text-warning transition-colors">
                      <Heart className="h-4 w-4" />
                      <span>{win.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{win.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="font-bold text-lg mb-2">Got a Win to Share?</h3>
          <p className="text-sm text-muted-foreground mb-4">Join the community and post your trades, pulls, and finds.</p>
          <Button className="bg-warning hover:bg-warning/90 text-black" asChild>
            <Link href="/register">
              Join Poké-Trade
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
