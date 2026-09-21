"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthUser } from "@/hooks/use-auth-user";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon maksimal 20 digit")
    .or(z.literal("")),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { user, loading: authLoading, refresh, setUser } = useAuthUser();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  // Sudah login → pulang
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const onSubmit = async (values: RegisterValues) => {
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Gagal mendaftar. Coba lagi.");
        return;
      }
      const loggedUser = data?.user ?? null;
      if (loggedUser) {
        setUser(loggedUser);
      } else {
        await refresh();
      }
      toast.success("Akun berhasil dibuat!", {
        description: `Selamat datang di KAVANA, ${loggedUser?.name ?? ""}!`,
      });
      const target = next.startsWith("/") ? next : "/";
      router.replace(target);
    } catch {
      toast.error("Gagal menghubungi server. Periksa koneksi kamu.");
    }
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
          <h1 className="text-2xl font-extrabold tracking-tight">Buat Akun KAVANA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gratis, cepat, dan langsung bisa belanja.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="cth. Budi Santoso"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                className="pr-12"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Nomor Telepon <span className="text-muted-foreground">(opsional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="cth. 0812xxxxxxx"
              aria-invalid={Boolean(form.formState.errors.phone)}
              {...form.register("phone")}
            />
            {form.formState.errors.phone && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {form.formState.errors.phone.message}
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
              <UserRoundPlus className="h-4 w-4" />
            )}
            Daftar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
