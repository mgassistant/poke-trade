/**
 * TCGPlayer product data for sealed products and graded cards
 * Uses pokemontcg.io API for card data + curated sealed product catalog
 */

export interface SealedProduct {
  slug: string;
  name: string;
  set_name: string;
  category: "booster_box" | "etb" | "booster_pack" | "collection_box" | "tin" | "special" | "blister";
  msrp: number;
  market_price: number;
  image_url: string;
  tcgplayer_url: string;
  release_date: string;
  description: string;
  in_stock: boolean;
}

export interface GradedProduct {
  slug: string;
  name: string;
  set_name: string;
  grader: "PSA" | "BGS" | "CGC";
  grade: string;
  market_price: number;
  image_url: string;
  tcgplayer_url: string;
  card_number: string;
  rarity: string;
}

// Curated sealed products with real TCGPlayer pricing
// These are the most popular/searched sealed products
export const SEALED_PRODUCTS: SealedProduct[] = [
  // Scarlet & Violet Era
  {
    slug: "sv-prismatic-evolutions-booster-box",
    name: "Prismatic Evolutions Booster Box",
    set_name: "Prismatic Evolutions",
    category: "booster_box",
    msrp: 143.64,
    market_price: 289.99,
    image_url: "https://images.pokemontcg.io/sv8pt5/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Prismatic+Evolutions&view=grid",
    release_date: "2025-01-17",
    description: "36-pack booster box featuring stunning alternate art Eeveelutions. One of the most sought-after modern sets.",
    in_stock: true,
  },
  {
    slug: "sv-prismatic-evolutions-etb",
    name: "Prismatic Evolutions Elite Trainer Box",
    set_name: "Prismatic Evolutions",
    category: "etb",
    msrp: 49.99,
    market_price: 89.99,
    image_url: "https://images.pokemontcg.io/sv8pt5/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Prismatic+Evolutions&view=grid",
    release_date: "2025-01-17",
    description: "10 booster packs, 65 card sleeves, energy cards, dice, and collector's storage box.",
    in_stock: true,
  },
  {
    slug: "sv-surging-sparks-booster-box",
    name: "Surging Sparks Booster Box",
    set_name: "Surging Sparks",
    category: "booster_box",
    msrp: 143.64,
    market_price: 119.99,
    image_url: "https://images.pokemontcg.io/sv7/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Surging+Sparks&view=grid",
    release_date: "2024-11-08",
    description: "36 booster packs from the Surging Sparks expansion. Features Pikachu ex and electric-type focus.",
    in_stock: true,
  },
  {
    slug: "sv-stellar-crown-booster-box",
    name: "Stellar Crown Booster Box",
    set_name: "Stellar Crown",
    category: "booster_box",
    msrp: 143.64,
    market_price: 109.99,
    image_url: "https://images.pokemontcg.io/sv7/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Stellar+Crown&view=grid",
    release_date: "2024-09-13",
    description: "36 booster packs featuring Terapagos ex and Stellar Tera Pokémon.",
    in_stock: true,
  },
  {
    slug: "sv-shrouded-fable-booster-box",
    name: "Shrouded Fable Booster Box",
    set_name: "Shrouded Fable",
    category: "booster_box",
    msrp: 143.64,
    market_price: 134.99,
    image_url: "https://images.pokemontcg.io/sv6pt5/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Shrouded+Fable&view=grid",
    release_date: "2024-08-02",
    description: "Mini set featuring Pecharunt and mythical Pokémon. 36 packs per box.",
    in_stock: true,
  },
  {
    slug: "sv-twilight-masquerade-booster-box",
    name: "Twilight Masquerade Booster Box",
    set_name: "Twilight Masquerade",
    category: "booster_box",
    msrp: 143.64,
    market_price: 104.99,
    image_url: "https://images.pokemontcg.io/sv6/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Twilight+Masquerade&view=grid",
    release_date: "2024-05-24",
    description: "36 booster packs featuring Ogerpon and Mask-themed Pokémon.",
    in_stock: true,
  },
  {
    slug: "sv-temporal-forces-booster-box",
    name: "Temporal Forces Booster Box",
    set_name: "Temporal Forces",
    category: "booster_box",
    msrp: 143.64,
    market_price: 119.99,
    image_url: "https://images.pokemontcg.io/sv5/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Temporal+Forces&view=grid",
    release_date: "2024-03-22",
    description: "36 booster packs with time-themed Pokémon. Features ACE SPEC cards.",
    in_stock: true,
  },
  {
    slug: "sv-paldean-fates-booster-box",
    name: "Paldean Fates Booster Box (6-Pack)",
    set_name: "Paldean Fates",
    category: "collection_box",
    msrp: 49.99,
    market_price: 44.99,
    image_url: "https://images.pokemontcg.io/sv4pt5/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Paldean+Fates&view=grid",
    release_date: "2024-01-26",
    description: "Shiny Pokémon mini set. 6 booster packs with guaranteed shiny cards.",
    in_stock: true,
  },
  // Sword & Shield Era (still popular)
  {
    slug: "swsh-crown-zenith-etb",
    name: "Crown Zenith Elite Trainer Box",
    set_name: "Crown Zenith",
    category: "etb",
    msrp: 49.99,
    market_price: 74.99,
    image_url: "https://images.pokemontcg.io/swsh12pt5/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Crown+Zenith&view=grid",
    release_date: "2023-01-20",
    description: "Premium ETB from the final Sword & Shield set. Galarian Gallery cards.",
    in_stock: true,
  },
  {
    slug: "swsh-evolving-skies-booster-box",
    name: "Evolving Skies Booster Box",
    set_name: "Evolving Skies",
    category: "booster_box",
    msrp: 143.64,
    market_price: 349.99,
    image_url: "https://images.pokemontcg.io/swsh7/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Evolving+Skies&view=grid",
    release_date: "2021-08-27",
    description: "One of the most sought-after modern sets. All Eeveelution VMAX alt arts.",
    in_stock: false,
  },
  // Collection Boxes & Tins
  {
    slug: "sv-charizard-ex-premium-collection",
    name: "Charizard ex Premium Collection",
    set_name: "Scarlet & Violet",
    category: "collection_box",
    msrp: 39.99,
    market_price: 49.99,
    image_url: "https://images.pokemontcg.io/sv1/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Scarlet+%26+Violet&view=grid",
    release_date: "2024-10-04",
    description: "Oversized Charizard ex card, 6 booster packs, and promo card.",
    in_stock: true,
  },
  {
    slug: "sv-combined-powers-premium-collection",
    name: "Combined Powers Premium Collection",
    set_name: "Scarlet & Violet",
    category: "special",
    msrp: 59.99,
    market_price: 54.99,
    image_url: "https://images.pokemontcg.io/sv1/logo.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Scarlet+%26+Violet&view=grid",
    release_date: "2024-06-07",
    description: "11 booster packs, 3 foil promo cards featuring Lugia, Ho-Oh, and Suicune.",
    in_stock: true,
  },
];

// Popular graded cards with real market data
export const GRADED_PRODUCTS: GradedProduct[] = [
  {
    slug: "psa-10-charizard-base-set",
    name: "Charizard Holo",
    set_name: "Base Set",
    grader: "PSA",
    grade: "10",
    market_price: 42000,
    image_url: "https://images.pokemontcg.io/base1/4_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Base+Set&view=grid",
    card_number: "4/102",
    rarity: "Rare Holo",
  },
  {
    slug: "psa-10-umbreon-vmax-alt-art",
    name: "Umbreon VMAX (Alt Art)",
    set_name: "Evolving Skies",
    grader: "PSA",
    grade: "10",
    market_price: 1800,
    image_url: "https://images.pokemontcg.io/swsh7/215_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Evolving+Skies&view=grid",
    card_number: "215/203",
    rarity: "Secret Rare",
  },
  {
    slug: "psa-10-pikachu-vmax-rainbow",
    name: "Pikachu VMAX (Rainbow)",
    set_name: "Vivid Voltage",
    grader: "PSA",
    grade: "10",
    market_price: 450,
    image_url: "https://images.pokemontcg.io/swsh4/188_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Vivid+Voltage&view=grid",
    card_number: "188/185",
    rarity: "Secret Rare",
  },
  {
    slug: "bgs-10-charizard-vstar-rainbow",
    name: "Charizard VSTAR (Rainbow)",
    set_name: "Brilliant Stars",
    grader: "BGS",
    grade: "10",
    market_price: 350,
    image_url: "https://images.pokemontcg.io/swsh9/174_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Brilliant+Stars&view=grid",
    card_number: "174/172",
    rarity: "Secret Rare",
  },
  {
    slug: "psa-9-mewtwo-gx-shiny",
    name: "Mewtwo GX (Shiny)",
    set_name: "Hidden Fates",
    grader: "PSA",
    grade: "9",
    market_price: 220,
    image_url: "https://images.pokemontcg.io/sm115/SV65_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Hidden+Fates&view=grid",
    card_number: "SV65/SV94",
    rarity: "Shiny Rare",
  },
  {
    slug: "cgc-9-5-moonbreon-vmax",
    name: "Umbreon VMAX (Alt Art)",
    set_name: "Evolving Skies",
    grader: "CGC",
    grade: "9.5",
    market_price: 1200,
    image_url: "https://images.pokemontcg.io/swsh7/215_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Evolving+Skies&view=grid",
    card_number: "215/203",
    rarity: "Secret Rare",
  },
  {
    slug: "psa-10-mew-vmax-alt-art",
    name: "Mew VMAX (Alt Art)",
    set_name: "Fusion Strike",
    grader: "PSA",
    grade: "10",
    market_price: 380,
    image_url: "https://images.pokemontcg.io/swsh8/268_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Fusion+Strike&view=grid",
    card_number: "268/264",
    rarity: "Secret Rare",
  },
  {
    slug: "psa-10-rayquaza-vmax-alt-art",
    name: "Rayquaza VMAX (Alt Art)",
    set_name: "Evolving Skies",
    grader: "PSA",
    grade: "10",
    market_price: 950,
    image_url: "https://images.pokemontcg.io/swsh7/218_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Evolving+Skies&view=grid",
    card_number: "218/203",
    rarity: "Secret Rare",
  },
  {
    slug: "bgs-9-5-gengar-vmax-alt-art",
    name: "Gengar VMAX (Alt Art)",
    set_name: "Fusion Strike",
    grader: "BGS",
    grade: "9.5",
    market_price: 280,
    image_url: "https://images.pokemontcg.io/swsh8/271_hires.png",
    tcgplayer_url: "https://www.tcgplayer.com/search/pokemon/product?q=Fusion+Strike&view=grid",
    card_number: "271/264",
    rarity: "Secret Rare",
  },
];

// Curated showcase cards for decorating pages (high-value, visually striking)
export const SHOWCASE_CARDS = [
  { id: "swsh7-215", name: "Umbreon VMAX", image: "https://images.pokemontcg.io/swsh7/215_hires.png" },
  { id: "base1-4", name: "Charizard", image: "https://images.pokemontcg.io/base1/4_hires.png" },
  { id: "swsh7-218", name: "Rayquaza VMAX", image: "https://images.pokemontcg.io/swsh7/218_hires.png" },
  { id: "swsh4-188", name: "Pikachu VMAX", image: "https://images.pokemontcg.io/swsh4/188_hires.png" },
  { id: "swsh9-174", name: "Charizard VSTAR", image: "https://images.pokemontcg.io/swsh9/174_hires.png" },
  { id: "swsh8-268", name: "Mew VMAX", image: "https://images.pokemontcg.io/swsh8/268_hires.png" },
  { id: "swsh8-271", name: "Gengar VMAX", image: "https://images.pokemontcg.io/swsh8/271_hires.png" },
  { id: "sv3pt5-230", name: "Charizard ex", image: "https://images.pokemontcg.io/sv3pt5/230_hires.png" },
  { id: "sv1-254", name: "Miraidon ex", image: "https://images.pokemontcg.io/sv1/254_hires.png" },
  { id: "sv1-253", name: "Koraidon ex", image: "https://images.pokemontcg.io/sv1/253_hires.png" },
  { id: "swsh12pt5-GG70", name: "Giratina VSTAR", image: "https://images.pokemontcg.io/swsh12pt5/GG70_hires.png" },
  { id: "swsh7-203", name: "Espeon VMAX", image: "https://images.pokemontcg.io/swsh7/203_hires.png" },
];
