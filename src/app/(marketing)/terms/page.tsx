import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "Poké-Trade Terms of Service — marketplace disclaimer, liability, authentication, and platform role.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: June 21, 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Marketplace Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade is an online platform that allows users to connect with one another for the purpose of buying, selling, and trading collectible items.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Poké-Trade is <strong className="text-foreground">not</strong> a buyer, seller, broker, dealer, auctioneer, escrow company, shipping company, grading company, authentication company, or party to any transaction conducted between users.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              All purchases, sales, trades, negotiations, agreements, and communications occur directly between users.
            </p>
            <p className="text-muted-foreground leading-relaxed">Users are solely responsible for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Verifying item authenticity</li>
              <li>Verifying item condition</li>
              <li>Reviewing listings</li>
              <li>Reviewing trade terms</li>
              <li>Packaging shipments</li>
              <li>Shipping items</li>
              <li>Obtaining insurance</li>
              <li>Complying with applicable laws</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">Poké-Trade does not guarantee:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Authenticity of items</li>
              <li>Accuracy of listings</li>
              <li>Condition of items</li>
              <li>Delivery of items</li>
              <li>Completion of transactions</li>
              <li>Performance of any user</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To the maximum extent permitted by law, Poké-Trade shall not be liable for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Fraud</li>
              <li>Counterfeit items</li>
              <li>Misrepresentation</li>
              <li>Shipping loss or damage</li>
              <li>Non-delivery</li>
              <li>Payment disputes</li>
              <li>Trade disputes</li>
              <li>User misconduct</li>
              <li>Financial losses</li>
            </ul>
            <p className="text-foreground font-semibold mt-4">Users participate at their own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Authentication Services</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade may offer optional authentication services through independent third-party providers. Authentication services are <strong className="text-foreground">not performed by Poké-Trade</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Any authentication service is performed solely by the selected third-party provider. Authentication fees are separate and non-refundable unless otherwise stated by the provider.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Poké-Trade does not guarantee the performance, accuracy, grading opinions, or decisions of any authentication provider. Users acknowledge that authentication services are optional and are used at their own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Platform Role</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade functions solely as a technology platform that facilitates communication and transaction opportunities between users. Poké-Trade does not take ownership of items and does not become a party to any transaction occurring through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Age Requirement</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You must be at least 13 years old to use Poké-Trade. If you are between 13 and 18, you must have parental or guardian consent. We reserve the right to terminate accounts that violate this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Trade Protection Program</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              The Trade Protection Program is a platform service designed to help resolve trade disputes. It is <strong className="text-foreground">NOT</strong> insurance. Benefits under the Trade Protection Program are subject to review, approval, and our platform terms. Poké-Trade reserves the right to deny, modify, or limit Trade Protection Program benefits at its sole discretion. Maximum eligible reimbursement amounts vary by membership tier and are subject to the terms in effect at the time of the trade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Insurance Referral Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade may, from time to time, provide access to or referrals for collectible insurance products through licensed insurance professionals and approved carrier partners. Poké-Trade is not an insurance company, does not sell insurance, and does not guarantee the availability, terms, or pricing of any insurance product. Any insurance transaction is solely between the user and the licensed insurance provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Platform Fee Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade charges platform fees on marketplace transactions (5% for free tier, 3% for Pro and Elite members). Trade Protection fees vary by membership tier (Free: $5.99 or 5%, Pro/Elite: $3.99 or 3%, whichever is higher) and are split equally between both trading parties. All fees are non-refundable once a transaction is completed. Poké-Trade does not buy, sell, inspect, authenticate, grade, store, ship, or take possession of any traded items.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade is not affiliated with, endorsed by, or connected to Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. Pokémon and all related marks are trademarks and © of their respective owners. Card images and pricing data are sourced from publicly available APIs for informational purposes.
            </p>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Questions about these terms?{" "}
              <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
