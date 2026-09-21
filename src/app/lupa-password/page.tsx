import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordClient } from "./lupa-password-client";
import { AuthSkeleton } from "@/app/login/auth-skeleton";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Atur ulang kata sandi akun KAVANA kamu dengan kode reset.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthSkeleton title="Lupa Kata Sandi" />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
