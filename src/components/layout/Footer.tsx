import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Platform: [
    { label: "Trade Center", href: "/trade-center" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Price Guide", href: "/price-guide" },
    { label: "Collection Tracker", href: "/collection" },
    { label: "Community", href: "/community" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
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
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Poké-Trade"
                width={140}
                height={42}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              The safest, smartest, and most trusted Pokémon card marketplace and trading platform.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Poké-Trade. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-lg text-center sm:text-right">
            Poké-Trade is not affiliated with, endorsed by, or connected to Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. Pokémon and all related marks are trademarks of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
