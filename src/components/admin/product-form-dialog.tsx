"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput, formatRupiahInput, parseRupiahInput } from "@/components/ui/currency-input";
import type { AdminCategory, AdminProduct } from "./types";

const productSchema = z
  .object({
    name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
    description: z.string().trim().min(10, "Deskripsi minimal 10 karakter"),
    price: z
      .string()
      .trim()
      .min(1, "Harga wajib diisi")
      .refine((v) => {
        const n = parseRupiahInput(v);
        return Number.isFinite(n) && n > 0;
      }, "Harga harus lebih dari 0"),
    compareAtPrice: z
      .string()
      .trim()
      .refine((v) => {
        if (!v) return true; // kosong = tanpa diskon
        const n = parseRupiahInput(v);
        return Number.isFinite(n) && n > 0;
      }, "Harga coret harus lebih dari 0"),
    stock: z
      .string()
      .trim()
      .min(1, "Stok wajib diisi")
      .refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 0;
      }, "Stok harus bilangan bulat ≥ 0"),
    categorySlug: z.string().min(1, "Kategori wajib dipilih"),
    image: z.string().trim(),
    featured: z.boolean(),
    isActive: z.boolean(),
  })
  .refine(
    (v) => {
      if (!v.compareAtPrice) return true;
      return parseRupiahInput(v.compareAtPrice) > parseRupiahInput(v.price);
    },
    {
      message: "Harga coret harus lebih tinggi dari harga jual",
      path: ["compareAtPrice"],
    }
  );

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AdminCategory[];
  initial: AdminProduct | null;
  onSaved: (product: AdminProduct, mode: "create" | "update") => void;
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      compareAtPrice: "",
      stock: "",
      categorySlug: "",
      image: "",
      featured: false,
      isActive: true,
    },
  });

  const imageValue = form.watch("image");
  const imageUrl = (imageValue ?? "").trim();

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        price: initial ? formatRupiahInput(initial.price) : "",
        compareAtPrice:
          initial?.compareAtPrice != null ? formatRupiahInput(initial.compareAtPrice) : "",
        stock: initial ? String(initial.stock) : "",
        categorySlug: initial?.categorySlug ?? "",
        image: initial?.image ?? "",
        featured: initial?.featured ?? false,
        isActive: initial?.isActive ?? true,
      });
    }
  }, [open, initial, form]);

  const onSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        description: values.description.trim(),
        price: parseRupiahInput(values.price),
        compareAtPrice: values.compareAtPrice ? parseRupiahInput(values.compareAtPrice) : null,
        stock: Number(values.stock),
        categorySlug: values.categorySlug,
        featured: values.featured,
        isActive: values.isActive,
      };
      if (imageUrl) payload.image = imageUrl;

      const res = await fetch(
        initial ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => null)) as {
        product?: AdminProduct;
        error?: string;
      } | null;
      if (!res.ok || !data?.product) {
        toast.error(data?.error ?? "Gagal menyimpan produk");
        return;
      }
      toast.success(
        initial ? "Perubahan produk disimpan" : "Produk berhasil ditambahkan"
      );
      onSaved(data.product, initial ? "update" : "create");
      onOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Perbarui informasi produk pada katalog toko."
              : "Tambahkan produk baru ke katalog toko KAVANA."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="cth. Kemeja Linen Sand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Deskripsi produk, bahan, ukuran, dsb."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="cth. 250.000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={1} placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="compareAtPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Harga Coret{" "}
                    <span className="font-normal text-muted-foreground">
                      (opsional — kosongkan bila tanpa diskon)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="cth. 299.000 (tampil diskon)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categorySlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Kategori tidak tersedia
                        </p>
                      ) : (
                        categories.map((c) => (
                          <SelectItem key={c.id} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URL Gambar{" "}
                    <span className="font-normal text-muted-foreground">(opsional)</span>
                  </FormLabel>
                  <div className="flex items-start gap-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Pratinjau gambar produk"
                        className="size-14 shrink-0 rounded-md border bg-secondary object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed bg-secondary text-xs text-muted-foreground"
                      >
                        kosong
                      </span>
                    )}
                    <FormControl>
                      <Input
                        placeholder="/images/products/produk-baru.png"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Unggulan</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Tampil di bagian unggulan
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Produk unggulan"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Aktif</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Terlihat di katalog toko
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Produk aktif"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {initial ? "Simpan Perubahan" : "Tambah Produk"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
