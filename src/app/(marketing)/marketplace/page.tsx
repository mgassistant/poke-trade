import { searchCards } from "@/lib/pokemon-tcg";
import { MarketplaceClient } from "@/components/marketplace/MarketplaceClient";

export const metadata = {
  title: "Marketplace",
  description: "Browse and buy Pokémon cards from trusted sellers. Low fees, verified traders, and secure payments.",
};

export default async function MarketplacePage() {
  let initialCards: Awaited<ReturnType<typeof searchCards>>["data"] = [];
  try {
    const result = await searchCards('supertype:pokemon (set.id:swsh4 OR set.id:swsh7 OR set.id:swsh9 OR set.id:swsh11 OR set.id:swsh12pt5) (rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:"Rare Holo V" OR rarity:"Rare Holo VMAX")', 1, 20);
    initialCards = result.data;
  } catch {
    initialCards = [];
  }

  return <MarketplaceClient initialCards={initialCards} />;
}
