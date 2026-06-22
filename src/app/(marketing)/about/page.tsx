import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Heart, Zap } from "lucide-react";

export const metadata = {
  title: "About",
  description: "Learn about Poké-Trade — the safest, smartest Pokémon card trading marketplace.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <Image
            src="/logo.png"
            alt="Poké-Trade"
            width={300}
            height={90}
            className="h-20 w-auto mx-auto mb-8"
          />
          <h1 className="text-4xl sm:text-5xl font-bold">
            About <span className="text-primary">Poké-Trade</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We&apos;re building the safest, smartest, and most trusted Pokémon card marketplace and trading platform in the world.
          </p>
        </div>

        {/* Mission */}
        <div className="space-y-12">
          <Card>
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Most marketplaces focus on selling. We focus on <span className="text-primary font-semibold">trading first</span>. 
                Pokémon card collecting has always been about trading with friends — swapping cards on the playground, at league nights, 
                and at local shops. Poké-Trade brings that experience online with smart matching, fair valuations, and a reputation 
                system you can trust.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="h-6 w-6" />, title: "Trust & Safety", desc: "Verified traders, buyer protection, and dispute resolution. Your cards and money are safe here." },
              { icon: <Heart className="h-6 w-6" />, title: "Community First", desc: "Built by collectors, for collectors. We listen to our community and build what matters." },
              { icon: <Zap className="h-6 w-6" />, title: "Fair & Transparent", desc: "Lowest fees in the industry (3-5%). No hidden costs. Real-time pricing from TCGPlayer." },
            ].map((value) => (
              <Card key={value.title}>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legal */}
          <Card className="bg-muted/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Legal Disclaimer</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Poké-Trade is not affiliated with, endorsed by, or connected to Nintendo, Game Freak, Creatures Inc., 
                or The Pokémon Company. Pokémon, the Pokémon logo, and all related marks are trademarks and © of their 
                respective owners. All card images and data are provided by pokemontcg.io and are used for informational 
                purposes. Poké-Trade is an independent marketplace platform.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center pt-8">
            <h2 className="text-2xl font-bold mb-4">Ready to join?</h2>
            <Button size="xl" variant="gradient" asChild>
              <Link href="/register">
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
