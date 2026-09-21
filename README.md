# KAVANA — Single-Merchant E-Commerce (Portfolio Demo)

Aplikasi e-commerce full-stack (customer storefront + admin dashboard) untuk portfolio.
Dibangun dengan **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite)**.
Pembayaran menggunakan **mock/sandbox gateway** (bukan pembayaran nyata).

## Fitur Utama

**Storefront (Customer)**
- Home page: hero, kategori, produk unggulan, diskon, testimonial, FAQ
- Katalog produk: pencarian, filter kategori & harga, sorting, pagination
- Detail produk: galeri, varian, stok, ulasan & rating, produk terkait
- Keranjang persisten (localStorage + sinkron DB), wishlist
- Checkout: alamat, ongkir, kode promo/diskon, mock payment (BCA/Mandiri/GoPay/OVO/QRIS/VISA)
- Order tracking: status `pending → paid → shipped → completed`, batalkan pesanan
- Auth: register, login, lupa password (reset token), halaman akun
- Light/dark mode, responsif mobile-first

**Admin Dashboard** (`/admin`)
- Statistik dashboard (revenue, order, produk terlaris, chart)
- CRUD produk (galeri gambar, varian, stok, harga, diskon)
- Manajemen pesanan: filter status, ubah status, bulk actions, export CSV
- Kelola user, email log, newsletter subscribers

## Cara Menjalankan

### 1. Install dependencies
```bash
bun install
# atau: npm install / pnpm install
```

### 2. Setup database (Prisma + SQLite)
```bash
bun run db:generate   # generate Prisma client
bun run db:push       # buat schema di SQLite
bunx tsx prisma/seed.ts   # isi data dummy (produk, user, order)
```
> Database file berada di `db/custom.db`. File `db/custom.db` dari ZIP sudah berisi seed data,
> jadi langkah di atas opsional jika ingin langsung memakai data yang ada.

### 3. Jalankan development server
```bash
bun run dev
```
Buka `http://localhost:3000`

### Akun Demo
| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@kavana.id     | admin123   |
| User  | budi@kavana.id      | budi123    |
| User  | sari@kavana.id      | sari123    |
| User  | dimas@kavana.id     | dimas123   |

*(Detail akun lain bisa dilihat di `prisma/seed.ts`)*

## Struktur Proyek
```
src/
  app/            # App Router (storefront + /admin + /api)
  components/     # UI components (shadcn/ui + komponen store/admin)
  lib/            # utils, db client, auth helper
prisma/
  schema.prisma   # Model: User, Product, Cart, Order, OrderItem, dst.
  seed.ts         # Data dummy
db/custom.db      # SQLite database
mini-services/    # notification-service (socket.io demo)
```

## Catatan
- Data & pembayaran bersifat **dummy/sandbox** — hanya untuk demo portfolio.
- Mock payment mensimulasikan alur: bayar → status `paid` → stok berkurang.
- Prisma client di `prisma/generated-client` di-generate ulang via `bun run db:generate`.

## Tech Stack
Next.js 16 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (New York) · Lucide Icons ·
Prisma ORM (SQLite) · TanStack Query · Zustand · next-themes · socket.io (mini service)
