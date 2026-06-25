import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { FEATURED_CARDS } from "@/lib/featured-cards";

// Fully static — no external API calls at build/render time
export const dynamic_config = "force-static";

// Lazy load below-fold sections
const TradeMatchSection = dynamic(() => import("@/components/home/TradeMatchSection").then(m => ({ default: m.TradeMatchSection })));
const CollectionSection = dynamic(() => import("@/components/home/CollectionSection").then(m => ({ default: m.CollectionSection })));
const BenefitsSection = dynamic(() => import("@/components/home/BenefitsSection").then(m => ({ default: m.BenefitsSection })));
const ReputationSection = dynamic(() => import("@/components/home/ReputationSection").then(m => ({ default: m.ReputationSection })));
const PricingSection = dynamic(() => import("@/components/home/PricingSection").then(m => ({ default: m.PricingSection })));
const TestimonialsSection = dynamic(() => import("@/components/home/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const CTASection = dynamic(() => import("@/components/home/CTASection").then(m => ({ default: m.CTASection })));

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <FeaturedListings cards={FEATURED_CARDS} />
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
