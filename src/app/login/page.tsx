import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./login-client";
import { AuthSkeleton } from "./auth-skeleton";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun KAVANA kamu untuk berbelanja dan melacak pesanan.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton title="Masuk" />}>
      <LoginClient />
    </Suspense>
  );
}
