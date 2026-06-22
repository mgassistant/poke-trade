import { CompareClient } from "@/components/compare/CompareClient";

export const metadata = {
  title: "Price Comparison",
  description: "Compare Pokémon card prices across TCGPlayer, eBay, CardMarket, and more. Find the best deal instantly.",
};

export default function ComparePage() {
  return <CompareClient />;
}
