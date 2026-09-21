"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, BadgePercent, BookmarkCheck, Loader2, MapPin, ShoppingBag, Ticket, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/components/store/use-hydrated";
import { CheckoutSteps } from "@/components/store/checkout-steps";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCartStore, cartSubtotal, cartCount } from "@/lib/cart-store";
import { formatRupiah, calcShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { evaluatePromo, PROMOS, type PromoResult } from "@/lib/promo";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(3, "Nama penerima wajib diisi (min. 3 karakter)").max(100),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon wajib diisi (min. 8 digit)")
    .max(20, "Nomor telepon maksimal 20 digit"),
  address: z.string().trim().min(5, "Alamat lengkap wajib diisi").max(500),
  city: z.string().trim().min(2, "Kota wajib diisi").max(100),
  postalCode: z.string().trim().max(10, "Kode pos maksimal 10 karakter"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const refreshStock = useCartStore((s) => s.refreshStock);
  // Tunggu rehidrasi zustand dari localStorage agar tidak hydration mismatch
  const mounted = useHydrated();

  // Voucher promo — preview di klien, validasi ulang di server saat order dibuat
  const [promoInput, setPromoInput] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);

  // Simpan alamat ke profil (agar checkout berikutnya terisi otomatis)
  const [saveAddress, setSaveAddress] = useState(true);

  const applyPromo = () => {
    const code = promoInput.trim();
    if (!code) return;
    const sub = cartSubtotal(lines);
    const ship = calcShipping(sub);
    const result = evaluatePromo(code, sub, ship);
    if (result.ok) {
      setAppliedPromo(result);
      setPromoInput("");
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    toast.info("Voucher dilepas.");
  };

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { customerName: "", phone: "", address: "", city: "", postalCode: "", notes: "" },
  });

  // Prefill dari profil user
  useEffect(() => {
    if (user) {
      form.reset({
        customerName: user.name ?? "",
        phone: user.phone ?? "",
        address: user.address ?? "",
        city: user.city ?? "",
        postalCode: "",
        notes: "",
      });
    }
  }, [user?.id]);

  // Proteksi halaman: belum login → redirect ke login dengan next
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu untuk checkout.");
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || !mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-40" />
        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const baseShipping = calcShipping(subtotal);
  const shipping = appliedPromo?.ok ? Math.max(0, baseShipping - appliedPromo.shippingDiscount) : baseShipping;
  const discount = appliedPromo?.ok ? appliedPromo.discount : 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const count = cartCount(lines);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Checkout</h1>
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </span>
          <p className="text-lg font-semibold">Keranjangmu kosong</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tambahkan produk dulu sebelum melanjutkan ke checkout.
          </p>
          <Button asChild size="lg" className="mt-2 rounded-full">
            <Link href="/products">
              <ArrowLeft className="mr-1 h-4 w-4" /> Mulai Belanja
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutValues) => {
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          ...values,
          postalCode: values.postalCode || undefined,
          notes: values.notes || undefined,
          promoCode: appliedPromo?.ok ? appliedPromo.code : undefined,
          saveAddress,
        }),
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        // FR-3: stok berubah saat checkout → pesan jelas + sinkronkan sisa stok ke cart
        toast.error(data?.error ?? "Gagal membuat pesanan. Coba lagi.");
        if (r.status === 422 && data?.productId && typeof data?.available === "number") {
          const line = lines.find((l) => l.productId === data.productId);
          if (line) {
            refreshStock([{ productId: data.productId, stock: data.available, price: line.price }]);
          }
        }
        return;
      }
      const orderNumber: string | undefined = data?.order?.orderNumber;
      if (!orderNumber) {
        toast.error("Respons server tidak dikenal. Coba lagi.");
        return;
      }
      clear(); // kosongkan keranjang setelah order dibuat
      toast.success("Pesanan berhasil dibuat!", { description: `Nomor: ${orderNumber}` });
      router.push(`/checkout/payment/${orderNumber}`);
    } catch {
      toast.error("Gagal menghubungi server. Periksa koneksi kamu.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi detail pengiriman — pembayaran mock menyusul.
          </p>
        </div>
        <CheckoutSteps current={1} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Form pengiriman */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MapPin className="h-5 w-5 text-primary" /> Informasi Pengiriman
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pastikan data benar agar pesanan sampai tepat sasaran.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="customerName">
                    Nama Penerima <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="cth. Budi Santoso"
                    autoComplete="name"
                    aria-invalid={Boolean(form.formState.errors.customerName)}
                    {...form.register("customerName")}
                  />
                  {form.formState.errors.customerName && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {form.formState.errors.customerName.message}
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

                <div className="space-y-1.5">
                  <Label htmlFor="city">
                    Kota <span className="text-destructive">*</span>
                  </Label>
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
                  <Label htmlFor="address">
                    Alamat Lengkap <span className="text-destructive">*</span>
                  </Label>
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

                <div className="space-y-1.5">
                  <Label htmlFor="postalCode">Kode Pos (opsional)</Label>
                  <Input
                    id="postalCode"
                    inputMode="numeric"
                    placeholder="cth. 40111"
                    autoComplete="postal-code"
                    aria-invalid={Boolean(form.formState.errors.postalCode)}
                    {...form.register("postalCode")}
                  />
                  {form.formState.errors.postalCode && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {form.formState.errors.postalCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Catatan untuk Penjual (opsional)</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="cth. Titip ke pos ronda jika tidak ada orang di rumah"
                    aria-invalid={Boolean(form.formState.errors.notes)}
                    {...form.register("notes")}
                  />
                  {form.formState.errors.notes && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {form.formState.errors.notes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Simpan alamat ke profil */}
              <label
                htmlFor="saveAddress"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3.5 transition-colors hover:bg-secondary/60"
              >
                <Checkbox
                  id="saveAddress"
                  checked={saveAddress}
                  onCheckedChange={(v) => setSaveAddress(v === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <BookmarkCheck className="h-4 w-4 text-primary" /> Simpan alamat ke profil
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Nama, telepon &amp; alamat ini akan otomatis terisi saat checkout berikutnya.
                  </span>
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Buat Pesanan · {formatRupiah(total)}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ringkasan pesanan */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-36">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold">Pesananmu ({count} item)</h2>
              <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {lines.map((l) => (
                  <li key={l.productId} className="flex items-center gap-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {l.image && (
                        <Image src={l.image} alt={l.name} fill sizes="56px" className="object-cover" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.quantity} × {formatRupiah(l.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{formatRupiah(l.price * l.quantity)}</p>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ongkir</span>
                  <span className="font-semibold">
                    {shipping === 0 ? <span className="text-emerald-600">GRATIS</span> : formatRupiah(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tambah {formatRupiah(FREE_SHIPPING_THRESHOLD - subtotal)} lagi untuk gratis ongkir.
                  </p>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Diskon voucher</span>
                    <span className="font-semibold text-emerald-600">−{formatRupiah(discount)}</span>
                  </div>
                )}
              </div>

              {/* Voucher promo */}
              <div className="rounded-xl border border-dashed border-border p-3">
                {appliedPromo?.ok ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Ticket className="h-4 w-4 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{appliedPromo.code}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{appliedPromo.label}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-full"
                      aria-label="Lepas voucher"
                      onClick={removePromo}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : promoOpen ? (
                  <div>
                    <div className="flex gap-2">
                      <Input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Ketik kode voucher"
                        className="h-9 uppercase"
                        aria-label="Kode voucher"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyPromo();
                          }
                        }}
                      />
                      <Button type="button" size="sm" className="h-9 shrink-0 rounded-full px-4" onClick={applyPromo}>
                        Terapkan
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PROMOS.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          title={p.description}
                          className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold tracking-wide text-secondary-foreground transition-colors hover:bg-secondary/70"
                          onClick={() => setPromoInput(p.code)}
                        >
                          {p.code}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                      Ketuk kode di atas untuk mengisinya, lalu tekan Terapkan.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                    onClick={() => setPromoOpen(true)}
                  >
                    <BadgePercent className="h-4 w-4" /> Punya kode voucher? Gunakan di sini
                  </button>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-extrabold text-primary">{formatRupiah(total)}</span>
              </div>

              <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                Stok akan divalidasi ulang oleh server saat pesanan dibuat (FR-3).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
