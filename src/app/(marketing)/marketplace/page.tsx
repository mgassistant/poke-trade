import { MarketplaceClient } from "@/components/marketplace/MarketplaceClient";

export const metadata = {
  title: "Marketplace",
  description: "Browse and buy Pokémon cards from trusted sellers. Compare prices across 19,000+ cards.",
};

export const revalidate = 300; // 5 min cache

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
