"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Newspaper, Clock, ArrowRight, Tag, Calendar, MapPin, Store, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const NEWS_ARTICLES = [
  {
    id: 1,
    category: "Release",
    title: "Pokémon TCG: 30th Celebration Set — Everything We Know",
    excerpt: "The biggest Pokémon TCG release of 2026 is coming September 16. Here's the full product lineup, pricing, and where to buy.",
    date: "June 21, 2026",
    readTime: "5 min",
    featured: true,
    tags: ["Release", "30th Anniversary"],
    retailers: ["Pokémon Center", "Target", "Walmart", "Amazon", "GameStop"],
  },
  {
    id: 2,
    category: "Restock Intel",
    title: "Chaos Rising ETBs Restocking at Target This Week",
    excerpt: "Multiple sources confirm Target is receiving Chaos Rising Elite Trainer Boxes. Expected to drop Friday at 12 AM PST.",
    date: "June 21, 2026",
    readTime: "3 min",
    featured: false,
    tags: ["Restock", "Target", "Chaos Rising"],
    retailers: ["Target"],
  },
  {
    id: 3,
    category: "Strategy",
    title: "Where to Buy Pokémon Cards at Retail — 2026 Store Guide",
    excerpt: "Complete guide to finding Pokémon cards at retail price. Store timing, restock schedules, and pro tips for every major retailer.",
    date: "June 20, 2026",
    readTime: "8 min",
    featured: false,
    tags: ["Guide", "Strategy"],
    retailers: ["Target", "Walmart", "Best Buy", "GameStop", "Costco"],
  },
  {
    id: 4,
    category: "Market",
    title: "Prismatic Evolutions Prices Stabilizing — Buy or Wait?",
    excerpt: "After months of hype, Prismatic Evolutions prices are settling. We analyze the data and tell you whether to buy now or hold.",
    date: "June 19, 2026",
    readTime: "6 min",
    featured: false,
    tags: ["Market Analysis", "Prismatic Evolutions"],
    retailers: [],
  },
  {
    id: 5,
    category: "Restock Intel",
    title: "Walmart Wednesday: What Dropped This Week",
    excerpt: "Recap of this week's Walmart Wednesday drops including Mega Evolution boxes, Prismatic ETBs, and First Partner collections.",
    date: "June 18, 2026",
    readTime: "4 min",
    featured: false,
    tags: ["Restock", "Walmart"],
    retailers: ["Walmart"],
  },
  {
    id: 6,
    category: "Strategy",
    title: "Best Pokémon Sets to Invest In — Mid-2026 Rankings",
    excerpt: "Our data team analyzed market trends across 50+ sets. Here are the top investment picks based on price trajectory and print runs.",
    date: "June 17, 2026",
    readTime: "10 min",
    featured: false,
    tags: ["Investment", "Market Analysis"],
    retailers: [],
  },
];

const CATEGORIES = ["All", "Release", "Restock Intel", "Strategy", "Market"];

export default function NewsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-4">
            <Newspaper className="h-3.5 w-3.5 mr-1.5" />
            Pokémon TCG News
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-primary">News</span> & Intel
          </h1>
          <p className="mt-2 text-muted-foreground">
            Release dates, restock intel, market analysis, and collecting strategy
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                cat === "All"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Article */}
        {NEWS_ARTICLES.filter((a) => a.featured).map((article) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-8 border-red-200 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Badge>{article.category}</Badge>
                  <Badge variant="outline" className="text-[10px]">Featured</Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">{article.title}</h2>
                <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{article.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime} read</span>
                </div>
                {article.retailers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.retailers.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px]">
                        <Store className="h-2.5 w-2.5 mr-1" />{r}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button asChild>
                  <Link href={`/news/${article.id}`}>
                    Read Full Article
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Article Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {NEWS_ARTICLES.filter((a) => !a.featured).map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full hover:border-primary/20 transition-all hover:-translate-y-1 cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>
                  </div>
                  <h3 className="font-bold text-base mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{article.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime}</span>
                  </div>
                  {article.retailers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.retailers.map((r) => (
                        <Badge key={r} variant="outline" className="text-[9px] py-0 px-1.5">{r}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
