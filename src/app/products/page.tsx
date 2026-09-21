import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsSkeleton } from "./products-skeleton";
import { ProductsClient } from "./products-client";

export const metadata: Metadata = {
  title: "Semua Produk",
  description:
    "Jelajahi seluruh koleksi KAVANA — apparel, aksesoris, gadget, dan perlengkapan rumah.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsClient />
    </Suspense>
  );
}
