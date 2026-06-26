"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 sm:h-24 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Poké-Trade"
              width={400}
              height={120}
              className="h-20 sm:h-24 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                asChild
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              asChild
            >
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
