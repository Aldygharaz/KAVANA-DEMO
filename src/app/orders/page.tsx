import type { Metadata } from "next";
import OrdersClient from "./orders-client";

export const metadata: Metadata = {
  title: "Pesanan Saya",
  description: "Riwayat pesanan belanjaanmu di KAVANA.",
};

export default function OrdersPage() {
  return <OrdersClient />;
}
