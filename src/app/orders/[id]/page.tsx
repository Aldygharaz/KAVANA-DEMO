import type { Metadata } from "next";
import OrderDetailClient from "./order-detail-client";

export const metadata: Metadata = {
  title: "Detail Pesanan",
  description: "Detail pesanan, status pengiriman, dan info pembayaran.",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const justPaid = sp.success === "1";
  return <OrderDetailClient id={id} justPaid={justPaid} />;
}
