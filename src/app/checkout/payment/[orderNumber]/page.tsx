import type { Metadata } from "next";
import PaymentClient from "./payment-client";

export const metadata: Metadata = {
  title: "Pembayaran",
  description: "Selesaikan pembayaran pesananmu (mock gateway).",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return <PaymentClient orderNumber={orderNumber} />;
}
