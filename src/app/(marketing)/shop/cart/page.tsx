import type { Metadata } from "next";
import { CartClient } from "@/components/shop/CartClient";

export const metadata: Metadata = {
  title: "Cart | Poké-Trade Shop",
  description: "Review your cart and proceed to checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
