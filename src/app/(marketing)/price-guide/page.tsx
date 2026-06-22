import { searchCards, getSets } from "@/lib/pokemon-tcg";
import { PriceGuideClient } from "@/components/price-guide/PriceGuideClient";

export const metadata = {
  title: "Price Guide",
  description: "Real-time Pokémon card prices, market trends, and value tracking. Powered by TCGPlayer market data.",
};

export default async function PriceGuidePage() {
  let topCards: Awaited<ReturnType<typeof searchCards>>["data"] = [];
  let sets: Awaited<ReturnType<typeof getSets>>["data"] = [];
  try {
    const [cardsRes, setsRes] = await Promise.all([
      searchCards('supertype:pokemon (rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:"Rare Holo VMAX")', 1, 20),
      getSets(1, 20),
    ]);
    topCards = cardsRes.data;
    sets = setsRes.data;
  } catch {
    topCards = [];
    sets = [];
  }

  return <PriceGuideClient initialCards={topCards} sets={sets} />;
}
