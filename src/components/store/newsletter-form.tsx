"use client";

import { useState } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Form newsletter mock — submit hanya menampilkan toast sukses
 * (tidak ada backend penyimpanan subscriber di demo ini).
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Masukkan email yang valid ya.");
      return;
    }
    setSubmitting(true);
    // Simulasi request singkat (mock)
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setDone(true);
    toast.success("Terima kasih sudah berlangganan!", {
      description: "Kode voucher selamat datang menuju email kamu (demo).",
    });
  };

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
        <MailCheck className="size-4 shrink-0" aria-hidden />
        Kamu terdaftar! Cek inbox untuk kode voucher KAVANA10.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-sm gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email untuk newsletter
      </label>
      <Input
        id="newsletter-email"
        type="email"
        placeholder="email kamu"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-10 rounded-full bg-background"
      />
      <Button
        type="submit"
        size="sm"
        disabled={submitting}
        className="h-10 shrink-0 rounded-full px-4"
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        Langganan
      </Button>
    </form>
  );
}
