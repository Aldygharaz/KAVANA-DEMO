import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterClient } from "./register-client";
import { AuthSkeleton } from "@/app/login/auth-skeleton";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun KAVANA baru dan mulai berbelanja koleksi kurasi kami.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton title="Daftar" />}>
      <RegisterClient />
    </Suspense>
  );
}
