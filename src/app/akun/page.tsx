import type { Metadata } from "next";

import { AkunClient } from "./akun-client";

export const metadata: Metadata = {
  title: "Akun Saya",
  description: "Kelola data profil dan alamat pengiriman KAVANA.",
};

export default function AkunPage() {
  return <AkunClient />;
}
