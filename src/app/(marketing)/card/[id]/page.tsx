import { getCard } from "@/lib/pokemon-tcg";
import { CardDetailClient } from "@/components/cards/CardDetailClient";
import { notFound } from "next/navigation";

interface CardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CardPageProps) {
  const { id } = await params;
  try {
    const card = await getCard(decodeURIComponent(id));
    return {
      title: `${card.name} — ${card.set.name}`,
      description: `View pricing, graded values, and population data for ${card.name} from ${card.set.name}. Compare prices across TCGPlayer, eBay, and CardMarket.`,
    };
  } catch {
    return { title: "Card Not Found" };
  }
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  let card;
  try {
    card = await getCard(decodeURIComponent(id));
  } catch {
    notFound();
  }

  if (!card) notFound();

  return <CardDetailClient card={card} />;
}
