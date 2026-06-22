export const TRADER_LEVELS = [
  { level: 1, name: "Rookie Trainer", minTrades: 0, icon: "🌱" },
  { level: 2, name: "Pokémon Trainer", minTrades: 5, icon: "⚡" },
  { level: 3, name: "Gym Trainer", minTrades: 15, icon: "🏋️" },
  { level: 4, name: "Gym Leader", minTrades: 50, icon: "🏅" },
  { level: 5, name: "Elite Four", minTrades: 100, icon: "💎" },
  { level: 6, name: "Pokémon Master", minTrades: 250, icon: "👑" },
] as const;

export const CARD_CONDITIONS = [
  { value: "mint", label: "Mint (M)" },
  { value: "near_mint", label: "Near Mint (NM)" },
  { value: "lightly_played", label: "Lightly Played (LP)" },
  { value: "moderately_played", label: "Moderately Played (MP)" },
  { value: "heavily_played", label: "Heavily Played (HP)" },
  { value: "damaged", label: "Damaged (D)" },
] as const;

export const CARD_RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Rare Holo",
  "Rare Holo EX",
  "Rare Holo GX",
  "Rare Holo V",
  "Rare VMAX",
  "Rare VSTAR",
  "Rare Ultra",
  "Rare Secret",
  "Rare Rainbow",
  "Amazing Rare",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Promo",
] as const;

export const GRADING_COMPANIES = [
  { value: "psa", label: "PSA" },
  { value: "bgs", label: "BGS (Beckett)" },
  { value: "cgc", label: "CGC" },
  { value: "sgc", label: "SGC" },
  { value: "ace", label: "ACE Grading" },
  { value: "other", label: "Other" },
] as const;

export const SUBSCRIPTION_TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "10 free P2P trades per month",
      "$1.25/side per trade after ($2.50 total)",
      "Up to 25 active marketplace listings",
      "5% marketplace sale fee",
      "Basic collection tracking",
      "Basic trade matching",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Poké-Trade Pro",
    price: 9.99,
    features: [
      "Unlimited P2P trades (no per-trade fee)",
      "Unlimited marketplace listings",
      "3% marketplace sale fee",
      "Advanced trade matching",
      "Collection analytics & value charts",
      "Market price alerts",
      "Pro badge on profile",
      "Priority support",
    ],
  },
  {
    id: "elite",
    name: "Poké-Trade Elite",
    price: 19.99,
    features: [
      "Everything in Pro",
      "Portfolio analytics & investment tracking",
      "Card authentication service discount (20% off)",
      "Featured profile placement",
      "Premium market insights & reports",
      "Early access to new features",
      "Elite badge on profile",
      "Dedicated support",
    ],
  },
] as const;

export const TRADE_FEES = {
  free: {
    monthlyFree: 10,
    perTradeFee: 2.50,   // total ($1.25 per side)
    perSideFee: 1.25,
  },
  pro: {
    monthlyFree: Infinity,
    perTradeFee: 0,
    perSideFee: 0,
  },
  elite: {
    monthlyFree: Infinity,
    perTradeFee: 0,
    perSideFee: 0,
  },
} as const;

export const AUTH_SERVICE_TIERS = [
  {
    name: "Basic Verification",
    price: 14.99,
    turnaround: "3-5 business days",
    features: [
      "Visual authenticity check",
      "Surface inspection",
      "Poké-Trade Verified badge",
      "Digital certificate",
    ],
  },
  {
    name: "Premium Authentication",
    price: 29.99,
    turnaround: "5-7 business days",
    features: [
      "Everything in Basic",
      "Light test & texture analysis",
      "Centering measurement",
      "Condition assessment",
      "Market value estimate",
      "Tamper-proof hologram seal",
    ],
  },
  {
    name: "Elite Authentication",
    price: 49.99,
    turnaround: "7-10 business days",
    features: [
      "Everything in Premium",
      "Full PSA/BGS-style grading comparison",
      "Professional photography",
      "Population report context",
      "Insurance-grade documentation",
      "Priority listing on marketplace",
    ],
  },
] as const;

export const ACHIEVEMENT_TYPES = [
  { type: "first_trade", name: "First Trade", description: "Complete your first trade", icon: "🤝" },
  { type: "trades_10", name: "Trader", description: "Complete 10 trades", icon: "📦" },
  { type: "trades_50", name: "Pro Trader", description: "Complete 50 trades", icon: "🏆" },
  { type: "trades_100", name: "Master Trader", description: "Complete 100 trades", icon: "👑" },
  { type: "collection_1000", name: "Collector", description: "Collection worth $1,000+", icon: "💰" },
  { type: "collection_10000", name: "Serious Collector", description: "Collection worth $10,000+", icon: "💎" },
  { type: "collection_100000", name: "Elite Collector", description: "Collection worth $100,000+", icon: "🏦" },
  { type: "first_sale", name: "First Sale", description: "Sell your first card", icon: "💵" },
  { type: "first_purchase", name: "First Purchase", description: "Buy your first card", icon: "🛒" },
  { type: "verified", name: "Verified", description: "Get your account verified", icon: "✅" },
  { type: "five_star", name: "Five Stars", description: "Receive a 5-star review", icon: "⭐" },
] as const;

export const TRADE_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "countered",
  "completed",
  "cancelled",
] as const;

export const LISTING_STATUSES = [
  "active",
  "sold",
  "cancelled",
  "expired",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
  "refunded",
  "disputed",
] as const;

export const PLATFORM_FEES = {
  free: 0.05,
  pro: 0.03,
  elite: 0.03,
} as const;

export const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/trade-center", label: "Trade Center" },
  { href: "/compare", label: "Compare" },
  { href: "/drops", label: "Drop Alerts" },
  { href: "/protect", label: "Protect" },
] as const;
