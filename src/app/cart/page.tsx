import type { Metadata } from "next";
import CartClient from "./cart-client";

export const metadata: Metadata = {
  title: "Keranjang",
  description: "Tinjau item di keranjang belanjamu sebelum checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
