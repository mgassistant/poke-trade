import type { TCGCard } from "./pokemon-tcg";

/**
 * Static featured card data — eliminates the 2+ second API call
 * that was blocking homepage server-side rendering.
 *
 * To update: run `curl "https://api.pokemontcg.io/v2/cards?q=id:<ID>&pageSize=1"`
 * and paste the relevant fields below.
 *
 * Last updated: 2026-06-25
 */
export const FEATURED_CARDS: TCGCard[] = [
  {
    id: "swsh45sv-SV107",
    name: "Charizard VMAX",
    supertype: "Pokémon",
    subtypes: ["VMAX"],
    hp: "330",
    number: "SV107",
    artist: "aky CG Works",
    rarity: "Rare Holo VMAX",
    images: {
      small: "https://images.pokemontcg.io/swsh45sv/SV107.png",
      large: "https://images.pokemontcg.io/swsh45sv/SV107_hires.png",
    },
    set: {
      id: "swsh45sv",
      name: "Shining Fates Shiny Vault",
      series: "Sword & Shield",
      printedTotal: 122,
      total: 122,
      releaseDate: "2021/02/19",
      images: {
        symbol: "https://images.pokemontcg.io/swsh45sv/symbol.png",
        logo: "https://images.pokemontcg.io/swsh45sv/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh45sv-SV107",
      updatedAt: "2026/06/25",
      prices: {
        holofoil: { low: 134.8, mid: 180.0, high: 349.95, market: 158.38, directLow: 168.0 },
      },
    },
  },
  {
    id: "swsh9-166",
    name: "Arceus V",
    supertype: "Pokémon",
    subtypes: ["Basic", "V"],
    hp: "220",
    number: "166",
    artist: "kawayoo",
    rarity: "Rare Ultra",
    images: {
      small: "https://images.pokemontcg.io/swsh9/166.png",
      large: "https://images.pokemontcg.io/swsh9/166_hires.png",
    },
    set: {
      id: "swsh9",
      name: "Brilliant Stars",
      series: "Sword & Shield",
      printedTotal: 172,
      total: 186,
      releaseDate: "2022/02/25",
      images: {
        symbol: "https://images.pokemontcg.io/swsh9/symbol.png",
        logo: "https://images.pokemontcg.io/swsh9/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh9-166",
      updatedAt: "2026/06/25",
      prices: {
        holofoil: { low: 50.11, mid: 72.88, high: 199.99, market: 62.4, directLow: 67.49 },
      },
    },
  },
  {
    id: "swsh12pt5-160",
    name: "Pikachu",
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "70",
    number: "160",
    artist: "You Iribi",
    rarity: "Rare Secret",
    images: {
      small: "https://images.pokemontcg.io/swsh12pt5/160.png",
      large: "https://images.pokemontcg.io/swsh12pt5/160_hires.png",
    },
    set: {
      id: "swsh12pt5",
      name: "Crown Zenith",
      series: "Sword & Shield",
      printedTotal: 159,
      total: 160,
      releaseDate: "2023/01/20",
      images: {
        symbol: "https://images.pokemontcg.io/swsh12pt5/symbol.png",
        logo: "https://images.pokemontcg.io/swsh12pt5/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh12pt5-160",
      updatedAt: "2026/06/25",
      prices: {
        holofoil: { low: 45.0, mid: 63.25, high: 250.0, market: 56.76, directLow: 44.99 },
      },
    },
  },
  {
    id: "swsh4-25",
    name: "Charizard",
    supertype: "Pokémon",
    subtypes: ["Stage 2"],
    hp: "170",
    number: "25",
    artist: "Ryuta Fuse",
    rarity: "Rare",
    images: {
      small: "https://images.pokemontcg.io/swsh4/25.png",
      large: "https://images.pokemontcg.io/swsh4/25_hires.png",
    },
    set: {
      id: "swsh4",
      name: "Vivid Voltage",
      series: "Sword & Shield",
      printedTotal: 185,
      total: 203,
      releaseDate: "2020/11/13",
      images: {
        symbol: "https://images.pokemontcg.io/swsh4/symbol.png",
        logo: "https://images.pokemontcg.io/swsh4/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh4-25",
      updatedAt: "2026/06/25",
      prices: {
        normal: { low: 0.96, mid: 4.0, high: 500.0, market: 4.14, directLow: 5.52 },
        reverseHolofoil: { low: 1.2, mid: 4.0, high: 29.99, market: 3.93, directLow: 6.94 },
      },
    },
  },
  {
    id: "swsh7-203",
    name: "Zinnia's Resolve",
    supertype: "Trainer",
    subtypes: ["Supporter"],
    number: "203",
    artist: "Taira Akitsu",
    rarity: "Rare Ultra",
    images: {
      small: "https://images.pokemontcg.io/swsh7/203.png",
      large: "https://images.pokemontcg.io/swsh7/203_hires.png",
    },
    set: {
      id: "swsh7",
      name: "Evolving Skies",
      series: "Sword & Shield",
      printedTotal: 203,
      total: 237,
      releaseDate: "2021/08/27",
      images: {
        symbol: "https://images.pokemontcg.io/swsh7/symbol.png",
        logo: "https://images.pokemontcg.io/swsh7/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh7-203",
      updatedAt: "2026/06/25",
      prices: {
        holofoil: { low: 4.0, mid: 5.99, high: 1000.0, market: 5.5, directLow: 7.09 },
      },
    },
  },
  {
    id: "swsh11-174",
    name: "Kyurem V",
    supertype: "Pokémon",
    subtypes: ["Basic", "V"],
    hp: "220",
    number: "174",
    artist: "takuyoa",
    rarity: "Rare Ultra",
    images: {
      small: "https://images.pokemontcg.io/swsh11/174.png",
      large: "https://images.pokemontcg.io/swsh11/174_hires.png",
    },
    set: {
      id: "swsh11",
      name: "Lost Origin",
      series: "Sword & Shield",
      printedTotal: 196,
      total: 217,
      releaseDate: "2022/09/09",
      images: {
        symbol: "https://images.pokemontcg.io/swsh11/symbol.png",
        logo: "https://images.pokemontcg.io/swsh11/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh11-174",
      updatedAt: "2026/06/25",
      prices: {
        holofoil: { low: 2.2, mid: 3.62, high: 24.99, market: 3.25, directLow: 3.91 },
      },
    },
  },
  {
    id: "sm35-1",
    name: "Bulbasaur",
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "70",
    number: "1",
    artist: "Mizue",
    rarity: "Common",
    images: {
      small: "https://images.pokemontcg.io/sm35/1.png",
      large: "https://images.pokemontcg.io/sm35/1_hires.png",
    },
    set: {
      id: "sm35",
      name: "Shining Legends",
      series: "Sun & Moon",
      printedTotal: 73,
      total: 81,
      releaseDate: "2017/10/06",
      images: {
        symbol: "https://images.pokemontcg.io/sm35/symbol.png",
        logo: "https://images.pokemontcg.io/sm35/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/sm35-1",
      updatedAt: "2026/06/25",
      prices: {
        normal: { low: 0.2, mid: 0.69, high: 19.04, market: 0.69, directLow: 0.85 },
        reverseHolofoil: { low: 2.71, mid: 3.32, high: 33.1, market: 3.42, directLow: null },
      },
    },
  },
  {
    id: "swsh35-44",
    name: "Inkay",
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "60",
    number: "44",
    artist: "sui",
    rarity: "Common",
    images: {
      small: "https://images.pokemontcg.io/swsh35/44.png",
      large: "https://images.pokemontcg.io/swsh35/44_hires.png",
    },
    set: {
      id: "swsh35",
      name: "Champion's Path",
      series: "Sword & Shield",
      printedTotal: 73,
      total: 80,
      releaseDate: "2020/09/25",
      images: {
        symbol: "https://images.pokemontcg.io/swsh35/symbol.png",
        logo: "https://images.pokemontcg.io/swsh35/logo.png",
      },
    },
    tcgplayer: {
      url: "https://prices.pokemontcg.io/tcgplayer/swsh35-44",
      updatedAt: "2026/06/25",
      prices: {
        normal: { low: 0.01, mid: 0.15, high: 19.82, market: 0.14, directLow: 0.07 },
        reverseHolofoil: { low: 0.06, mid: 0.25, high: 19.98, market: 0.17, directLow: 0.13 },
      },
    },
  },
];
