import { getFeaturedCards } from "@/lib/pokemon-tcg";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { TradeMatchSection } from "@/components/home/TradeMatchSection";
import { CollectionSection } from "@/components/home/CollectionSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { ReputationSection } from "@/components/home/ReputationSection";
import { PricingSection } from "@/components/home/PricingSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";

export default async function HomePage() {
  let featuredCards: Awaited<ReturnType<typeof getFeaturedCards>> = [];
  try {
    featuredCards = await getFeaturedCards();
  } catch {
    featuredCards = [];
  }

  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <FeaturedListings cards={featuredCards} />
      <TradeMatchSection />
      <CollectionSection />
      <BenefitsSection />
      <ReputationSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
