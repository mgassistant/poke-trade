import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Poké-Trade | The Ultimate Pokémon Card Trading Marketplace",
    template: "%s | Poké-Trade",
  },
  description:
    "Trade, buy, sell, and track Pokémon cards on the safest, smartest, and most trusted marketplace. Lower fees, trade matching, collection tracking, and more.",
  keywords: [
    "Pokémon card trading",
    "trade Pokémon cards",
    "buy Pokémon cards",
    "sell Pokémon cards",
    "Pokémon marketplace",
    "Pokémon collection tracker",
    "Pokémon card values",
    "TCG trading",
    "Pokémon card marketplace",
  ],
  authors: [{ name: "Poké-Trade" }],
  creator: "Poké-Trade",
  metadataBase: new URL("https://poke-trade.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://poke-trade.com",
    siteName: "Poké-Trade",
    title: "Poké-Trade | The Ultimate Pokémon Card Trading Marketplace",
    description:
      "Trade, buy, sell, and track Pokémon cards without marketplace-level fees.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Poké-Trade",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poké-Trade",
    description:
      "The ultimate Pokémon card trading marketplace.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
