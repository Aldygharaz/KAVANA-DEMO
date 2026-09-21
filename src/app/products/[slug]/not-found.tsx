import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <PackageSearch className="h-9 w-9 text-muted-foreground" />
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight">Produk tidak ditemukan</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Produk yang kamu cari mungkin sudah tidak tersedia atau tautannya salah.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link href="/products">Jelajahi Produk</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
