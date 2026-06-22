import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Poké-Trade",
  description: "Poké-Trade Privacy Policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: June 22, 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Poké-Trade (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the poke-trade.com website and related services (the &quot;Platform&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We collect information you provide directly to us, information we collect automatically, and information from third parties.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4">Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Account information:</strong> name, email address, phone number, username, password</li>
              <li><strong className="text-foreground">Identity verification:</strong> government-issued ID (processed by Stripe Identity), phone number verification</li>
              <li><strong className="text-foreground">Profile information:</strong> bio, profile photo, collection details</li>
              <li><strong className="text-foreground">Transaction data:</strong> listings, offers, trades, purchases, shipping addresses</li>
              <li><strong className="text-foreground">Communications:</strong> messages between users, support requests, dispute evidence</li>
              <li><strong className="text-foreground">Payment information:</strong> processed by Stripe — we do not store full credit card numbers</li>
            </ul>
            <h3 className="text-base font-semibold text-foreground mt-4">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Log data (IP address, access times, pages viewed, referral URLs)</li>
              <li>Usage data (features used, search queries, interactions with listings)</li>
              <li>Cookies and similar tracking technologies (see our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Provide, maintain, and improve the Platform</li>
              <li>Process transactions and send related notifications</li>
              <li>Verify user identities and prevent fraud</li>
              <li>Facilitate trades, sales, and communications between users</li>
              <li>Send you technical notices, security alerts, and support messages</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze trends, usage, and activities on the Platform</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>Personalize and improve your experience (e.g., recommended listings)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">With other users:</strong> Your profile information, listings, ratings, and trade history are visible to other users as part of the Platform&apos;s functionality</li>
              <li><strong className="text-foreground">Service providers:</strong> Stripe (payments & identity verification), cloud hosting providers, analytics services, and email delivery services</li>
              <li><strong className="text-foreground">Legal compliance:</strong> When required by law, regulation, legal process, or governmental request</li>
              <li><strong className="text-foreground">Safety & fraud prevention:</strong> To protect the rights, property, or safety of Poké-Trade, our users, or the public</li>
              <li><strong className="text-foreground">Business transfers:</strong> In connection with any merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We use cookies and similar technologies to operate the Platform, remember your preferences, and analyze usage. For detailed information about the cookies we use and how to manage them, please see our{" "}
              <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong className="text-foreground">Correction:</strong> Request that we correct inaccurate or incomplete information</li>
              <li><strong className="text-foreground">Deletion:</strong> Request that we delete your personal information, subject to legal obligations</li>
              <li><strong className="text-foreground">Portability:</strong> Request a machine-readable copy of your data</li>
              <li><strong className="text-foreground">Opt-out:</strong> Unsubscribe from marketing emails at any time via the link in the email</li>
              <li><strong className="text-foreground">Restrict processing:</strong> Request that we limit how we use your data in certain circumstances</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:privacy@poke-trade.com" className="text-primary hover:underline">privacy@poke-trade.com</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We retain your personal information for as long as your account is active or as needed to provide you services. We may also retain certain information as required by law or for legitimate business purposes, such as:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Transaction records: retained for 7 years for tax and legal compliance</li>
              <li>Dispute records: retained permanently for fraud prevention</li>
              <li>Account data: deleted within 90 days of account deletion request, except where retention is required by law</li>
              <li>Anonymized/aggregated data: may be retained indefinitely for analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete that information promptly. If you believe a child under 13 has provided us with personal information, please contact us at{" "}
              <a href="mailto:privacy@poke-trade.com" className="text-primary hover:underline">privacy@poke-trade.com</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Users between 13 and 18 may use the Platform only with parental or guardian consent and supervision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Security</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We implement appropriate technical and organizational measures to protect your personal information, including encryption in transit (TLS), secure password hashing, and access controls. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-1 mt-2">
              <li>Email: <a href="mailto:privacy@poke-trade.com" className="text-primary hover:underline">privacy@poke-trade.com</a></li>
              <li>General support: <a href="mailto:support@poke-trade.com" className="text-primary hover:underline">support@poke-trade.com</a></li>
            </ul>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              See also:{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
              {" · "}
              <Link href="/acceptable-use" className="text-primary hover:underline">Acceptable Use Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
