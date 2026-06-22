import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Acceptable Use Policy | Poké-Trade",
  description: "Poké-Trade Acceptable Use Policy — rules for using the platform, prohibited items and behavior, and enforcement.",
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Acceptable Use Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: June 22, 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              This Acceptable Use Policy (&quot;AUP&quot;) governs your use of the Poké-Trade platform. By using Poké-Trade, you agree to comply with this policy. Violations may result in account suspension, permanent ban, and/or legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Prohibited Items</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The following items are strictly prohibited from being listed, sold, or traded on Poké-Trade:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Counterfeit cards:</strong> Fake, replica, or proxy Pokémon cards of any kind. This includes cards from unauthorized print runs, Chinese fakes, and any card not officially produced by The Pokémon Company.</li>
              <li><strong className="text-foreground">Stolen merchandise:</strong> Cards or collectibles obtained through theft, burglary, or fraud. If we have reason to believe items are stolen, we will cooperate with law enforcement.</li>
              <li><strong className="text-foreground">Repack scams:</strong> Resealed or tampered booster packs, boxes, or sealed products. Listing resealed products as factory-sealed is fraud.</li>
              <li><strong className="text-foreground">Misrepresented graded cards:</strong> Cards with altered, forged, or counterfeit grading labels or slabs. Trimmed cards submitted for grading and sold as authentic.</li>
              <li><strong className="text-foreground">Non-Pokémon items:</strong> Items not related to the Pokémon Trading Card Game (with limited exceptions for closely related Pokémon collectibles).</li>
              <li><strong className="text-foreground">Digital-only items:</strong> Pokémon TCG Online/Live codes or digital assets (unless specifically enabled in a future feature).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Prohibited Behavior</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The following behaviors are not allowed on Poké-Trade:
            </p>

            <h3 className="text-base font-semibold text-foreground mt-4">Market Manipulation</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Price manipulation:</strong> Coordinating with others to artificially inflate or deflate card prices</li>
              <li><strong className="text-foreground">Shill bidding:</strong> Using alternate accounts or colluding with others to bid up your own listings</li>
              <li><strong className="text-foreground">Wash trading:</strong> Trading with yourself (using multiple accounts) to inflate your trade count, ratings, or sales history</li>
              <li><strong className="text-foreground">Review manipulation:</strong> Leaving fake positive reviews on your own account or fake negative reviews on competitors</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-4">Deceptive Practices</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Misrepresenting card condition, authenticity, or grade in listings</li>
              <li>Using stolen photos or stock images instead of actual photos of the card being sold</li>
              <li>Listing items you do not possess or intend to ship</li>
              <li>Bait-and-switch: shipping a different card than what was listed or agreed upon</li>
              <li>Providing false information during identity verification</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-4">Harassment & Abuse</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Threatening, harassing, or intimidating other users</li>
              <li>Hate speech, discrimination, or slurs of any kind</li>
              <li>Doxxing or sharing another user&apos;s personal information</li>
              <li>Spamming users with unsolicited messages or trade offers</li>
              <li>Abusing the dispute or report system to harass other users</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-4">Technical Abuse</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Scraping, crawling, or automated access without written permission</li>
              <li>Attempting to exploit vulnerabilities, bugs, or security weaknesses</li>
              <li>Circumventing rate limits, verification requirements, or account restrictions</li>
              <li>Using bots or automated tools to create listings, send offers, or snipe deals</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Account Rules</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-4">
              <li><strong className="text-foreground">One account per person:</strong> Multiple accounts are prohibited. If you need a business account, contact support.</li>
              <li><strong className="text-foreground">Account sharing:</strong> Do not share your account credentials with others. You are responsible for all activity on your account.</li>
              <li><strong className="text-foreground">Accurate information:</strong> All account information must be truthful and current. Fake names, stolen identities, or false details are prohibited.</li>
              <li><strong className="text-foreground">Age requirement:</strong> You must be at least 13 years old to use Poké-Trade. Users under 18 require parental consent.</li>
              <li><strong className="text-foreground">Ban evasion:</strong> Creating a new account to circumvent a ban or suspension will result in immediate permanent ban of all associated accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Enforcement & Consequences</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We enforce this policy through a combination of automated systems and manual review by our Trust & Safety team. Consequences are proportional to the severity of the violation:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Warning:</strong> First-time minor violations may result in a written warning and content removal</li>
              <li><strong className="text-foreground">Temporary suspension:</strong> Repeated violations or moderate offenses result in 7–30 day account suspension</li>
              <li><strong className="text-foreground">Permanent ban:</strong> Serious violations (counterfeiting, fraud, harassment) result in immediate permanent ban</li>
              <li><strong className="text-foreground">Legal action:</strong> Criminal activity (fraud, theft, counterfeiting) may be reported to law enforcement</li>
              <li><strong className="text-foreground">Funds hold:</strong> Pending payouts may be frozen during investigation of policy violations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              All enforcement decisions can be appealed by contacting{" "}
              <a href="mailto:appeals@poke-trade.com" className="text-primary hover:underline">appeals@poke-trade.com</a>{" "}
              within 14 days of the action. Appeals are reviewed by a senior member of the Trust & Safety team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Reporting Violations</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you encounter a violation of this policy, please report it immediately:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use the <Link href="/report" className="text-primary hover:underline">Report an Issue</Link> page</li>
              <li>Email <a href="mailto:safety@poke-trade.com" className="text-primary hover:underline">safety@poke-trade.com</a></li>
              <li>Use the &quot;Report&quot; button on any listing or user profile</li>
            </ul>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              See also:{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/safety" className="text-primary hover:underline">Trust & Safety</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
