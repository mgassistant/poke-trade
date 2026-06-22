import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | Poké-Trade",
  description: "Poké-Trade Cookie Policy — what cookies we use, why, and how to manage them.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: June 22, 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              This Cookie Policy explains how Poké-Trade (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies and similar technologies when you visit our website at poke-trade.com. It explains what these technologies are, why we use them, and your rights to control their use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently, provide a better user experience, and give website operators useful information. Cookies may be &quot;session&quot; cookies (deleted when you close your browser) or &quot;persistent&quot; cookies (remain on your device for a set period or until you delete them).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">Essential Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These cookies are necessary for the Platform to function and cannot be switched off. They are usually set in response to actions you take, such as logging in, setting preferences, or filling in forms.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong className="text-foreground">Authentication cookies:</strong> Keep you signed in as you navigate the site</li>
              <li><strong className="text-foreground">Session cookies:</strong> Maintain your session state (e.g., items in cart, trade in progress)</li>
              <li><strong className="text-foreground">Security cookies:</strong> Help detect fraud and protect your account (CSRF tokens)</li>
              <li><strong className="text-foreground">Load balancing:</strong> Distribute traffic across our servers for optimal performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">Analytics Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These cookies help us understand how visitors interact with the Platform by collecting and reporting information anonymously. This helps us improve the site for everyone.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong className="text-foreground">Usage analytics:</strong> Pages visited, time on site, bounce rate, feature usage</li>
              <li><strong className="text-foreground">Performance monitoring:</strong> Page load times, error tracking, API response times</li>
              <li><strong className="text-foreground">A/B testing:</strong> Help us test improvements to the Platform experience</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We use privacy-focused analytics tools that do not track you across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">Preference Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These cookies remember choices you make to give you a better, personalized experience.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong className="text-foreground">Theme preference:</strong> Remember your dark/light mode selection</li>
              <li><strong className="text-foreground">Language preference:</strong> Remember your preferred language</li>
              <li><strong className="text-foreground">Display settings:</strong> Grid vs. list view, sort preferences, filters</li>
              <li><strong className="text-foreground">Cookie consent:</strong> Remember your cookie preferences so we don&apos;t ask repeatedly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">How to Manage Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You have the right to accept or reject cookies. Here&apos;s how to manage them:
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4">Browser Settings</h3>
            <p className="text-muted-foreground leading-relaxed">
              Most browsers allow you to control cookies through their settings. You can typically find these in the &quot;Options,&quot; &quot;Preferences,&quot; or &quot;Privacy&quot; section of your browser. You can:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Block all cookies</li>
              <li>Accept only first-party cookies</li>
              <li>Delete cookies when you close your browser</li>
              <li>Delete existing cookies at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Please note:</strong> Blocking essential cookies will prevent the Platform from functioning properly. You may not be able to log in, complete trades, or use core features if essential cookies are disabled.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4">Do Not Track</h3>
            <p className="text-muted-foreground leading-relaxed">
              Some browsers offer a &quot;Do Not Track&quot; (DNT) setting. We respect DNT signals and will not use analytics cookies when DNT is enabled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. The &quot;Last updated&quot; date at the top will always reflect the most recent version.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-border/30 pb-2">Contact</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you have questions about our use of cookies, contact us at{" "}
              <a href="mailto:privacy@poke-trade.com" className="text-primary hover:underline">privacy@poke-trade.com</a>.
            </p>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              See also:{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
