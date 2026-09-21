import type { Metadata } from "next";
import CheckoutClient from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Lengkapi informasi pengiriman dan tinjau pesananmu.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
