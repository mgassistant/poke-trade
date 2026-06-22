import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Grading Guide | Poké-Trade",
  description: "Learn about PSA, BGS, and CGC grading for Pokémon cards. Understand grade scales, costs, turnaround times, and how grading affects value.",
};

export default function GradingGuidePage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Grading Guide</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Everything you need to know about getting your Pokémon cards professionally graded
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">What Is Card Grading?</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Card grading is a professional service where experts evaluate the condition of a Pokémon card and assign it a numerical grade. The card is then sealed in a tamper-evident plastic case (&quot;slab&quot;) with a label showing the grade. Graded cards are authenticated, protected, and typically command higher prices than raw (ungraded) cards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">The Big Three Grading Companies</h2>

            <Card className="mt-4">
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground text-base">PSA (Professional Sports Authenticator)</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  The most popular and widely recognized grading service for Pokémon cards. PSA grades on a 1–10 scale with half-point increments at the top (PSA 9, PSA 10). A PSA 10 &quot;Gem Mint&quot; is the gold standard and commands the highest premiums.
                </p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2">
                  <li><strong className="text-foreground">Scale:</strong> 1 (Poor) → 10 (Gem Mint)</li>
                  <li><strong className="text-foreground">Turnaround:</strong> 30–65 business days (Standard); 5 days (Express); 2 days (Super Express)</li>
                  <li><strong className="text-foreground">Cost:</strong> ~$20/card (Standard), ~$75 (Express), ~$150 (Super Express)</li>
                  <li><strong className="text-foreground">Best for:</strong> Maximum resale value and liquidity; most collectors prefer PSA slabs</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-3">
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground text-base">BGS (Beckett Grading Services)</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Known for detailed subgrades that break down the card&apos;s condition into four categories: Centering, Corners, Edges, and Surface. Each subgrade is scored 1–10 with half-points, and the overall grade is a weighted average.
                </p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2">
                  <li><strong className="text-foreground">Scale:</strong> 1–10 overall with four subgrades (Centering, Corners, Edges, Surface)</li>
                  <li><strong className="text-foreground">Turnaround:</strong> 30–50 business days (Standard); 5 days (Express)</li>
                  <li><strong className="text-foreground">Cost:</strong> ~$20/card (Standard), ~$100 (Express)</li>
                  <li><strong className="text-foreground">Special labels:</strong> BGS 10 &quot;Pristine&quot; and BGS 10 &quot;Black Label&quot; (all four subgrades = 10) are extremely rare and valuable</li>
                  <li><strong className="text-foreground">Best for:</strong> Collectors who want detailed condition breakdowns; BGS Black Label 10s rival PSA 10s in value</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-3">
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground text-base">CGC (Certified Guaranty Company)</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  A newer entrant to Pokémon card grading (established in trading cards in 2020). CGC also provides subgrades and offers competitive pricing. Their slabs are known for being durable and attractive.
                </p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2">
                  <li><strong className="text-foreground">Scale:</strong> 1–10 with optional subgrades (Centering, Corners, Edges, Surface)</li>
                  <li><strong className="text-foreground">Turnaround:</strong> 25–50 business days (Standard); 5 days (Express)</li>
                  <li><strong className="text-foreground">Cost:</strong> ~$15–$18/card (Standard), ~$65 (Express)</li>
                  <li><strong className="text-foreground">Best for:</strong> Budget-friendly grading; modern cards where you want authentication and protection</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">The PSA Grade Scale</h2>
            <div className="mt-4 space-y-2">
              {[
                { grade: "PSA 10", name: "Gem Mint", desc: "Perfect condition. Sharp corners, perfect centering (within 55/45), no flaws visible under magnification." },
                { grade: "PSA 9", name: "Mint", desc: "Near-perfect. Minor centering issues allowed (within 60/40). One tiny imperfection allowed." },
                { grade: "PSA 8", name: "NM-MT", desc: "Near Mint to Mint. Slight wear visible on close inspection. Minor edge or corner imperfections." },
                { grade: "PSA 7", name: "Near Mint", desc: "Light wear throughout. Slight corner fraying, minor edge nicks, or minor surface scratches." },
                { grade: "PSA 6", name: "EX-MT", desc: "Excellent to Mint. Moderate wear. Noticeable scratches, slight indentation, or visible centering issues." },
                { grade: "PSA 5", name: "Excellent", desc: "Clearly visible wear. Rounded corners, scratches, or off-center printing. Still presentable." },
                { grade: "PSA 4", name: "VG-EX", desc: "Heavy wear. Rounded corners, noticeable scratches, creasing possible." },
                { grade: "PSA 1–3", name: "Poor to VG", desc: "Significant damage: creases, stains, tears, heavy wear. Mainly for rare vintage cards where any authenticated copy has value." },
              ].map((item) => (
                <div key={item.grade} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-foreground text-sm">{item.grade}</span>
                    <span className="text-xs text-primary">({item.name})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Should You Grade or Sell Raw?</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Grading isn&apos;t always worth it. Here&apos;s how to decide:
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 text-success">✅ Grade When:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>The card is worth $50+ raw and appears to be in PSA 8+ condition</li>
              <li>It&apos;s a vintage card (Base Set, Jungle, Fossil, Team Rocket, etc.) — grading adds significant value</li>
              <li>You believe it&apos;ll receive a PSA 9 or 10 — the jump from raw to graded 10 can be 3–10x</li>
              <li>It&apos;s a chase card or desirable illustration rare from a modern set</li>
              <li>You want long-term protection and authentication for your personal collection</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-6 text-destructive">❌ Sell Raw When:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>The card is worth under $30 raw — grading costs eat into your margin</li>
              <li>The card has visible flaws (whitening, scratches, off-center) that will score PSA 7 or below</li>
              <li>It&apos;s a common modern card with high print runs</li>
              <li>You need to sell quickly — grading turnaround can take weeks to months</li>
              <li>The graded market for that specific card is thin (few comparable sales)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">How Grading Affects Value</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The impact of grading on value varies enormously by card and grade. Here are some general patterns:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">PSA 10 vs PSA 9:</strong> Typically 2–5x premium. For iconic cards (1st Edition Base Set Charizard), the gap can be 10x+.</li>
              <li><strong className="text-foreground">PSA 9 vs Raw NM:</strong> Usually 1.5–2x premium. The authentication and protection add confidence for buyers.</li>
              <li><strong className="text-foreground">PSA 7–8 vs Raw:</strong> Minimal premium for modern cards. For vintage, even lower grades add value because authentication proves the card is real.</li>
              <li><strong className="text-foreground">PSA 1–6:</strong> Only worth grading for rare vintage cards where authentication matters more than condition.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Key takeaway:</strong> Grading is an investment. Factor in the grading fee, shipping costs, and turnaround time before deciding. Use Poké-Trade&apos;s price data to compare raw vs. graded sale prices for your specific card.
            </p>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Need help deciding whether to grade?{" "}
              <Link href="/help" className="text-primary hover:underline">Ask in our Help Center</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
