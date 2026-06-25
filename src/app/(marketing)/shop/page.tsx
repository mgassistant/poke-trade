import type { Metadata } from "next";
import { ShopLanding } from "@/components/shop/ShopLanding";

export const metadata: Metadata = {
  title: "Shop | Poké-Trade",
  description:
    "Members get first access to limited TCG drops under market pricing. Shop sealed products, singles, graded cards, and mystery packs.",
  openGraph: {
    title: "Poké-Trade Shop",
    description:
      "Exclusive TCG drops at fair prices. Anti-scalper protection & verified inventory.",
  },
};

export const revalidate = 60;

export default function ShopPage() {
  return <ShopLanding />;
}
