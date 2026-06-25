import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Platform: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Trade Center", href: "/trade-center" },
    { label: "Compare Prices", href: "/compare" },
    { label: "Drop Alerts", href: "/drops" },
    { label: "Price Guide", href: "/price-guide" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "News & Intel", href: "/news" },
    { label: "Membership", href: "/membership" },
    { label: "Community", href: "/community" },
    { label: "Wins Feed", href: "/wins" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
    { label: "Support Center", href: "/support" },
    { label: "Contact Us", href: "/contact" },
    { label: "Trust & Safety", href: "/safety" },
    { label: "Shipping Guide", href: "/shipping-guide" },
    { label: "Grading Guide", href: "/grading-guide" },
    { label: "Feedback", href: "/feedback" },
    { label: "Report an Issue", href: "/report" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Acceptable Use", href: "/acceptable-use" },
    { label: "DMCA", href: "/dmca" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0a0f1e] border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Poké-Trade"
                width={280}
                height={84}
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-3 text-sm text-slate-500 max-w-xs">
              The safest, smartest, and most trusted Pokémon card marketplace and
              trading platform.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-3">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5" />

        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Poké-Trade. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 max-w-lg text-center sm:text-right">
            Poké-Trade is not affiliated with, endorsed by, or connected to
            Nintendo, Game Freak, Creatures Inc., or The Pokémon Company.
            Pokémon and all related marks are trademarks of their respective
            owners.
          </p>
        </div>

        <div className="pb-6 pt-2">
          <p className="text-[10px] text-slate-700 leading-relaxed text-center max-w-4xl mx-auto">
            Poké-Trade is a technology platform and marketplace. Poké-Trade is
            not an insurance company and does not underwrite, bind, or administer
            insurance coverage. Trade Protection Program benefits are subject to
            review and platform terms. Insurance products, when available, are
            offered separately by licensed insurance professionals through
            approved carrier partners.
          </p>
        </div>
      </div>
    </footer>
  );
}
