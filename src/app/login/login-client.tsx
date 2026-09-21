"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthUser } from "@/hooks/use-auth-user";

const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { email: "admin@kavana.id", password: "admin123", label: "Admin" },
  { email: "budi@kavana.id", password: "budi123", label: "Customer" },
];

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { user, loading: authLoading, refresh, setUser } = useAuthUser();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Sudah login → langsung ke tujuan
  useEffect(() => {
    if (!authLoading && user) {
      let target = next.startsWith("/") ? next : "/";
      if (target === "/" && user.role === "ADMIN") {
        target = "/admin";
      }
      router.replace(target);
    }
  }, [authLoading, user, router, next]);

  const onSubmit = async (values: LoginValues) => {
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Gagal masuk. Coba lagi.");
        return;
      }
      const loggedUser = data?.user ?? null;
      if (loggedUser) {
        setUser(loggedUser);
      } else {
        await refresh();
      }
      toast.success(`Selamat datang kembali, ${loggedUser?.name ?? ""}!`);
      let target = next.startsWith("/") ? next : "/";
      if (target === "/" && loggedUser?.role === "ADMIN") {
        target = "/admin";
      }
      router.replace(target);
    } catch {
      toast.error("Gagal menghubungi server. Periksa koneksi kamu.");
    }
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    form.setValue("email", acc.email, { shouldValidate: true });
    form.setValue("password", acc.password, { shouldValidate: true });
    toast.info(`Kredensial ${acc.label} terisi otomatis`);
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Memuat" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Masuk ke KAVANA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Belanja lebih mudah, lacak pesanan dengan nyaman.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nama@email.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center gap-3">
                <Link
                  href="/lupa-password"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Lupa kata sandi?
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Masuk
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-secondary/60 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Akun Demo
          </p>
          <ul className="mt-2.5 space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-muted-foreground">
                  {acc.email} / {acc.password}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => fillDemo(acc)}
                >
                  Isi otomatis
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href={next !== "/" ? `/register?next=${encodeURIComponent(next)}` : "/register"}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
