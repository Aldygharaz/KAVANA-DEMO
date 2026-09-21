"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MailQuestion,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Stepper 3 langkah di atas kartu */
const STEPS = ["Email", "Kode & Password", "Selesai"] as const;

function WizardSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2" aria-label="Langkah reset password">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                active && "bg-primary text-primary-foreground",
                done && "bg-primary/10 text-primary",
                !active && !done && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                  active && "bg-primary-foreground text-primary",
                  done && "bg-primary text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

const emailSchema = z.object({
  email: z.email("Email tidak valid"),
});
const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Kode harus 6 digit angka"),
    newPassword: z.string().min(6, "Password minimal 6 karakter").max(72),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export function ForgotPasswordClient() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const requestCode = async (targetEmail: string) => {
    const r = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = (await r.json().catch(() => null)) as {
      message?: string;
      demoCode?: string;
      error?: string;
    } | null;
    if (!r.ok) {
      toast.error(data?.error ?? "Gagal mengirim kode reset.");
      return null;
    }
    return data;
  };

  const onSubmitEmail = async (values: EmailValues) => {
    setDemoCode(null);
    setEmail(values.email.trim().toLowerCase());
    const data = await requestCode(values.email.trim().toLowerCase());
    if (!data) return;
    if (data.demoCode) {
      setDemoCode(data.demoCode);
      resetForm.setValue("code", data.demoCode, { shouldValidate: false });
      toast.info("Mode demo: kode reset ditampilkan di layar.", {
        description: "Di produksi, kode dikirim via email.",
      });
    } else {
      toast.info(data.message ?? "Kode reset dikirim bila email terdaftar.");
    }
    setStep(1);
  };

  const resend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const data = await requestCode(email);
      if (data?.demoCode) {
        setDemoCode(data.demoCode);
        resetForm.setValue("code", data.demoCode, { shouldValidate: false });
        toast.success("Kode baru berhasil dibuat.");
      } else {
        toast.info(data?.message ?? "Jika email terdaftar, kode baru telah dikirim.");
      }
    } catch {
      toast.error("Gagal menghubungi server.");
    } finally {
      setResending(false);
    }
  };

  const onSubmitReset = async (values: ResetValues) => {
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: values.code,
          newPassword: values.newPassword,
        }),
      });
      const data = (await r.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      if (!r.ok) {
        toast.error(data?.error ?? "Gagal mereset password.");
        return;
      }
      toast.success("Password berhasil direset!");
      setStep(2);
    } catch {
      toast.error("Gagal menghubungi server.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Lupa Kata Sandi?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tenang, kami bantu atur ulang dalam 3 langkah singkat.
          </p>
        </div>

        <div className="mt-5">
          <WizardSteps current={step} />
        </div>

        {/* STEP 1 — Email */}
        {step === 0 && (
          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email akun</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nama@email.com"
                aria-invalid={Boolean(emailForm.formState.errors.email)}
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full"
              disabled={emailForm.formState.isSubmitting}
            >
              {emailForm.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailQuestion className="h-4 w-4" />
              )}
              Kirim Kode Reset
            </Button>
          </form>
        )}

        {/* STEP 2 — Kode + password baru */}
        {step === 1 && (
          <form onSubmit={resetForm.handleSubmit(onSubmitReset)} noValidate className="mt-6 space-y-4">
            {demoCode && (
              <div className="rounded-xl border border-dashed border-amber-600/50 bg-amber-500/10 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="size-3.5" /> Mode Demo — Kode Reset
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Di produksi kode ini dikirim via email. Kode kamu:
                  <span className="ml-1.5 rounded-md bg-background px-2 py-0.5 font-mono text-sm font-bold tracking-[0.2em] text-foreground">
                    {demoCode}
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="code">Kode reset (6 digit)</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                className="text-center font-mono text-lg tracking-[0.4em]"
                aria-invalid={Boolean(resetForm.formState.errors.code)}
                {...resetForm.register("code")}
              />
              {resetForm.formState.errors.code && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {resetForm.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPassword">Password baru</Label>
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
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(resetForm.formState.errors.newPassword)}
                {...resetForm.register("newPassword")}
              />
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Ulangi password baru</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)}
                {...resetForm.register("confirmPassword")}
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full"
              disabled={resetForm.formState.isSubmitting}
            >
              {resetForm.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Reset Password
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setDemoCode(null);
                  resetForm.reset();
                  setStep(0);
                }}
                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Ganti email
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={resending}
                className="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-60"
              >
                {resending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Kirim ulang kode
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 — Sukses */}
        {step === 2 && (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-9" aria-hidden />
            </span>
            <h2 className="text-lg font-bold">Password berhasil direset!</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Semua sesi login lama telah dikeluarkan demi keamanan. Silakan masuk
              dengan password baru kamu.
            </p>
            <Button asChild size="lg" className="mt-2 h-12 w-full rounded-full">
              <Link href="/login">Masuk Sekarang</Link>
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
