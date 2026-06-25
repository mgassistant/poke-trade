import type { Metadata } from "next";
import { ShopDropsClient } from "@/components/shop/ShopDropsClient";

export const metadata: Metadata = {
  title: "Drop Calendar | Poké-Trade Shop",
  description: "Upcoming and live product drops. Members get early access to limited releases.",
};

export default function ShopDropsPage() {
  return <ShopDropsClient />;
}
