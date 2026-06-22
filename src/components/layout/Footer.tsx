import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Platform: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Trade Center", href: "/trade-center" },
    { label: "Compare Prices", href: "/compare" },
    { label: "Drop Alerts", href: "/drops" },
    { label: "Price Guide", href: "/price-guide" },
  ],
  Community: [
    { label: "News & Intel", href: "/news" },
    { label: "Wins Feed", href: "/wins" },
    { label: "Collection Tracker", href: "/collection" },
    { label: "Protect", href: "/protect" },
    { label: "Community", href: "/community" },
  ],
  Support: [
    { label: "Trust & Safety", href: "/safety" },
    { label: "Help Center", href: "/help" },
    { label: "Shipping Guide", href: "/shipping-guide" },
    { label: "Grading Guide", href: "/grading-guide" },
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
    <footer className="bg-gray-50 border-t border-gray-200">
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
            <p className="mt-3 text-sm text-gray-500 max-w-xs">
              The safest, smartest, and most trusted Pokémon card marketplace and trading platform.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-gray-200" />

        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Poké-Trade. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 max-w-lg text-center sm:text-right">
            Poké-Trade is not affiliated with, endorsed by, or connected to Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. Pokémon and all related marks are trademarks of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
