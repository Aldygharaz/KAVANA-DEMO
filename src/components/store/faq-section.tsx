"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Apakah toko ini nyata?",
    a: "KAVANA adalah demo portfolio — seluruh katalog, pesanan, dan pembayaran bersifat dummy/sandbox. Tidak ada transaksi nyata yang terjadi, tetapi seluruh alur (belanja → bayar → lacak) berfungsi penuh seperti toko sungguhan.",
  },
  {
    q: "Bagaimana cara melakukan pembayaran?",
    a: "Setelah checkout, kamu akan diarahkan ke halaman pembayaran mock. Pilih metode (VA BCA, QRIS, kartu, dsb.) lalu klik Bayar — sistem mensimulasikan proses 2 detik dan pesanan langsung berstatus Dibayar dengan nomor referensi pembayaran.",
  },
  {
    q: "Berapa ongkos pengirimannya?",
    a: "Ongkir flat Rp25.000 untuk semua pengiriman. Gratis ongkir untuk pembelian minimal Rp500.000 — progres menuju gratis ongkir tampil otomatis di halaman keranjang.",
  },
  {
    q: "Apakah stok produk berkurang saat saya membeli?",
    a: "Ya. Stok baru dipotong ketika pembayaran berhasil, dan checkout diblokir bila jumlah yang diminta melebihi stok yang tersedia. Coba beli produk berstok sedikit (badge 'sisa N') untuk melihat validasinya.",
  },
  {
    q: "Bisakah saya membatalkan pesanan?",
    a: "Bisa, selama pesanan masih berstatus Menunggu Pembayaran. Setelah dibayar, pesanan masuk proses pengiriman dan tidak dapat dibatalkan dari sisi pelanggan. Admin juga dapat memperbarui status pesanan dari panel admin.",
  },
  {
    q: "Di mana saya bisa melihat riwayat pesanan saya?",
    a: "Buka menu 'Pesanan Saya' setelah login. Setiap pesanan punya halaman detail dengan pelacak status (Dibayar → Dikirim → Selesai), rincian item, alamat pengiriman, dan nomor resi saat dikirim.",
  },
] as const;

export const FaqSection = () => {
  return (
    <section aria-labelledby="faq-heading" className="bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            Semua yang perlu kamu tahu sebelum mencoba alur belanja di KAVANA.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
