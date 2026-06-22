import Image from "next/image";
import Link from "next/link";
import {
  Package, Truck, MapPin, Shield, Globe, AlertTriangle, Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Shipping Guide | Poké-Trade",
  description: "How to safely package and ship Pokémon cards on Poké-Trade. Penny sleeves, toploaders, bubble mailers, and more.",
};

export default function ShippingGuidePage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Shipping Guide</h1>
          <p className="text-sm text-muted-foreground mt-2">
            How to safely ship Pokémon cards to fellow traders and buyers
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Packaging Your Cards
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Proper packaging is the most important step in shipping Pokémon cards. A card that arrives damaged is a card that starts a dispute. Follow these steps every time.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6">Step 1: Penny Sleeve</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every card — raw or graded — starts in a penny sleeve. This thin plastic sleeve prevents surface scratches during transit. Insert the card top-down so it doesn&apos;t slide out.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6">Step 2: Toploader or Card Saver</h3>
            <p className="text-muted-foreground leading-relaxed">
              Slide the sleeved card into a rigid toploader (3&quot; × 4&quot; standard). For graded cards in slabs, use appropriate slab cases or extra padding. Tape the top of the toploader shut with a small piece of painter&apos;s tape — never use tape that touches the card.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6">Step 3: Secure in Envelope or Mailer</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Under $20:</strong> Plain white envelope (PWE) with &quot;Do Not Bend&quot; written on it, toploader sandwiched between cardboard</li>
              <li><strong className="text-foreground">$20–$100:</strong> Bubble mailer with the toploader wrapped in tissue or bubble wrap</li>
              <li><strong className="text-foreground">Over $100:</strong> Small box with bubble wrap padding on all sides, void fill to prevent movement</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-6">Step 4: Seal It Properly</h3>
            <p className="text-muted-foreground leading-relaxed">
              Use quality packing tape to seal all openings. For bubble mailers, fold the flap and tape across the entire width. The package should feel rigid — if the toploader can shift around, add more padding.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Shipping Methods
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Choose your shipping method based on the value of the card and the buyer&apos;s expectations.
            </p>

            <div className="mt-4 space-y-3">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">USPS First Class Mail</h3>
                  <p className="text-sm text-muted-foreground mt-1">Best for cards under $50. $1–$4 with tracking. Delivery in 3–5 business days. Available at USPS.com or your local post office.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">USPS Priority Mail</h3>
                  <p className="text-sm text-muted-foreground mt-1">Best for cards $50–$500. $8–$15 with tracking and $50 included insurance. 1–3 business days. Free boxes from USPS.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">UPS Ground / UPS 2nd Day Air</h3>
                  <p className="text-sm text-muted-foreground mt-1">Best for high-value cards ($500+) or multiple cards. $10–$25+. Full tracking, insurance available up to declared value. More reliable handling for expensive shipments.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">USPS Registered Mail</h3>
                  <p className="text-sm text-muted-foreground mt-1">For extremely high-value cards ($1,000+). Every hand-off is documented and signed. Slower (7–10 days) but the most secure domestic option. Insurance up to $50,000.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Tracking Requirements
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade requires tracking for all transactions over $25. Here&apos;s why it matters:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Tracking is your proof of shipment and delivery</li>
              <li>Without tracking, you cannot win a &quot;not received&quot; dispute</li>
              <li>Upload your tracking number to the trade/order page within 3 business days of confirmation</li>
              <li>Escrow funds are not released until delivery is confirmed via tracking</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Pro tip:</strong> Always take a photo of the shipping label and receipt. This is your backup proof if tracking information is lost.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Insurance Recommendations
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Shipping insurance protects you if a package is lost, stolen, or damaged in transit. Here&apos;s what we recommend:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Under $50:</strong> Optional — tracking alone is usually sufficient</li>
              <li><strong className="text-foreground">$50–$250:</strong> Recommended — USPS Priority includes $50 free; add extra for higher values</li>
              <li><strong className="text-foreground">$250–$1,000:</strong> Strongly recommended — purchase insurance for the full declared value</li>
              <li><strong className="text-foreground">Over $1,000:</strong> Required — insure for full value. Consider third-party insurance (Shipsurance, ParcelGuard) for better rates</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Important:</strong> Poké-Trade is not responsible for lost or damaged shipments. Insurance is between you and your carrier or insurance provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              International Shipping
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade supports international trades and sales. Keep these points in mind:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use USPS First Class International (under $400) or Priority Mail International (over $400)</li>
              <li>Always get tracking — use registered mail for items over $100</li>
              <li>Customs forms are required: declare the accurate value of the contents</li>
              <li>The buyer is responsible for any import duties, taxes, or customs fees</li>
              <li>Delivery times range from 7–21 business days depending on the destination</li>
              <li>Some countries have restrictions on importing certain goods — check before shipping</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Note:</strong> International disputes are harder to resolve due to longer shipping times and limited tracking in some countries. We recommend extra caution and insurance for cross-border transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Common Mistakes to Avoid
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-4">
              <li>Never put tape directly on a card or penny sleeve</li>
              <li>Don&apos;t use regular envelopes without cardboard reinforcement</li>
              <li>Don&apos;t skip the toploader — a penny sleeve alone won&apos;t prevent bending</li>
              <li>Don&apos;t reuse damaged or worn packaging materials</li>
              <li>Don&apos;t ship without tracking for orders over $25</li>
              <li>Don&apos;t undervalue cards on customs forms to avoid fees — it&apos;s illegal</li>
            </ul>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Questions about shipping?{" "}
              <Link href="/help" className="text-primary hover:underline">Visit our Help Center</Link>
              {" "}or email{" "}
              <a href="mailto:support@poke-trade.com" className="text-primary hover:underline">support@poke-trade.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
