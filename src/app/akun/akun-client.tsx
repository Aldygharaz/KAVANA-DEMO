"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatDate } from "@/lib/format";

const profileSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon maksimal 20 digit"),
  address: z.string().trim().max(500, "Alamat maksimal 500 karakter"),
  city: z.string().trim().max(100, "Kota maksimal 100 karakter"),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface ProfileStats {
  totalOrders: number;
  completedOrders: number;
  memberSince: string;
}

export function AkunClient() {
  const router = useRouter();
  const { user, loading: authLoading, refresh, setUser } = useAuthUser();

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", address: "", city: "" },
  });

  // Proteksi halaman
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu.");
      router.replace("/login?next=/akun");
    }
  }, [authLoading, user, router]);

  // Muat profil + stats
  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetch("/api/account/profile")
      .then(async (r) => {
        const data = r.ok ? await r.json() : await r.json().catch(() => null);
        if (!alive) return;
        if (r.ok && data?.user) {
          form.reset({
            name: data.user.name ?? "",
            phone: data.user.phone ?? "",
            address: data.user.address ?? "",
            city: data.user.city ?? "",
          });
          setStats(data.stats ?? null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setStatsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid gap-6 md:grid-cols-5">
          <Skeleton className="h-48 rounded-xl md:col-span-2" />
          <Skeleton className="h-96 rounded-xl md:col-span-3" />
        </div>
      </div>
    );
  }

  const onSubmit = async (values: ProfileValues) => {
    try {
      const r = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Gagal menyimpan profil. Coba lagi.");
        return;
      }
      toast.success("Profil berhasil disimpan!", {
        description: "Data ini otomatis terisi saat checkout.",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (data?.user) {
        setUser(data.user);
      } else {
        await refresh();
      }
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server. Periksa koneksi kamu.");
    }
  };

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full">
        <Link href="/">
          <ChevronLeft className="h-4 w-4" /> Beranda
        </Link>
      </Button>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-lg font-extrabold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> {user.email}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              {user.role === "ADMIN" ? "ADMIN" : "PELANGGAN"}
            </span>
          </p>
        </div>
      </div>

      {/* Ringkasan aktivitas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {statsLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <p className="text-xl font-extrabold tabular-nums">{stats?.totalOrders ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground">total pesanan</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {statsLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <p className="text-xl font-extrabold tabular-nums">{stats?.completedOrders ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground">pesanan selesai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {statsLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="truncate text-sm font-bold">
                  {stats?.memberSince ? formatDate(stats.memberSince) : "-"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">bergabung sejak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        {/* Form profil */}
        <Card className="md:col-span-3">
          <CardContent className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <UserRound className="h-5 w-5 text-primary" /> Data Profil
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Data ini dipakai untuk otomatis mengisi form checkout.
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="cth. Budi Santoso"
                    autoComplete="name"
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
                  <Label htmlFor="phone">
                    Nomor Telepon <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="cth. 0812xxxxxxx"
                    autoComplete="tel"
                    aria-invalid={Boolean(form.formState.errors.phone)}
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="city">Kota</Label>
                  <Input
                    id="city"
                    placeholder="cth. Bandung"
                    autoComplete="address-level2"
                    aria-invalid={Boolean(form.formState.errors.city)}
                    {...form.register("city")}
                  />
                  {form.formState.errors.city && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                    autoComplete="street-address"
                    aria-invalid={Boolean(form.formState.errors.address)}
                    {...form.register("address")}
                  />
                  {form.formState.errors.address && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="rounded-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saved ? "Tersimpan" : "Simpan Perubahan"}
                </Button>
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info alamat tersimpan + CTA */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-primary" /> Alamat Tersimpan
              </h2>
              {user.address || user.city ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-semibold">{user.name}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3 w-3" /> {user.phone || "-"}
                  </p>
                  <p className="leading-relaxed text-foreground/90">
                    {user.address}
                    {user.city ? `, ${user.city}` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Belum ada alamat tersimpan. Isi form di samping lalu simpan.
                </p>
              )}
              <Separator className="my-4" />
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/products">
                  <ShoppingBag className="h-4 w-4" /> Mulai Belanja
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
