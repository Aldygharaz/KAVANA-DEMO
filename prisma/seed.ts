/**
 * Seed KAVANA — single-vendor ecommerce demo.
 * Run: bun run prisma/seed.ts
 */
import { PrismaClient } from "./generated-client";
import crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const CATEGORIES = [
  { name: "Apparel", slug: "apparel", icon: "shirt" },
  { name: "Aksesoris", slug: "aksesoris", icon: "watch" },
  { name: "Gadget", slug: "gadget", icon: "headphones" },
  { name: "Rumah", slug: "rumah", icon: "lamp" },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number; // harga sebelum diskon (harga coret)
  stock: number;
  featured?: boolean;
  categorySlug: string;
};

const PRODUCTS: SeedProduct[] = [
  // ---- Apparel ----
  {
    name: 'Kaos Oversize "Daily Classic"',
    slug: "kaos-oversize-daily-classic",
    description:
      "Kaos oversize dari katun combed 24s premium dengan potongan boxy yang nyaman dipakai harian. Bahan lembut, adem, dan tidak melar meski sering dicuci. Cocok untuk gaya kasual maupun layering.",
    price: 149_000,
    stock: 42,
    featured: true,
    categorySlug: "apparel",
  },
  {
    name: 'Hoodie Fleece "Urban Warmth"',
    slug: "hoodie-urban-warmth",
    description:
      "Hoodie fleece denganinside brush yang hangat tanpa berat. Kantong kanguru, drawstring kukuh, dan rib manset yang tetap elastis. Teman terbaik untuk malam yang dingin.",
    price: 389_000,
    compareAtPrice: 447_000,
    stock: 24,
    featured: true,
    categorySlug: "apparel",
  },
  {
    name: 'Kemeja Linen "Coastal Breeze"',
    slug: "kemeja-linen-coastal-breeze",
    description:
      "Kemeja linen serat alami yang ringan dan breathable — ideal untuk iklim tropis. Detail sutra pada jahitan dan warna netral yang mudah dipadukan.",
    price: 279_000,
    compareAtPrice: 312_000,
    stock: 18,
    categorySlug: "apparel",
  },
  {
    name: 'Topi Dad Cap "Logo Stitch"',
    slug: "topi-dad-cap-logo-stitch",
    description:
      "Dad cap katun dengan bordir logo minimalis. Strap belakang yang adjustable memastikan pas di semua ukuran kepala.",
    price: 89_000,
    stock: 3,
    categorySlug: "apparel",
  },
  // ---- Aksesoris ----
  {
    name: 'Tote Bag Canvas "Everyday Carry"',
    slug: "tote-bag-canvas-everyday-carry",
    description:
      "Tote bag canvas 12oz dengan lining dalam dan kantong zipper. Muat laptop 14 inci, botol minum, dan kebutuhan harian lainnya.",
    price: 129_000,
    compareAtPrice: 161_000,
    stock: 35,
    featured: true,
    categorySlug: "aksesoris",
  },
  {
    name: 'Dompet Kulit "Slimfold"',
    slug: "dompet-kulit-slimfold",
    description:
      "Dompet kulit sapi asli dengan desain slim — cukup 6 kartu, uang tunai, dan koin. Semakin lama dipakai semakin cantik patinanya.",
    price: 199_000,
    stock: 27,
    categorySlug: "aksesoris",
  },
  {
    name: 'Kalung Stainless "Minimal Chain"',
    slug: "kalung-stainless-minimal-chain",
    description:
      "Kalung stainless steel anti-karat dengan rantai 3mm yang elegan. Aman untuk kulit sensitif dan tahan air.",
    price: 159_000,
    stock: 2,
    categorySlug: "aksesoris",
  },
  {
    name: 'Ikat Pinggang "Buckle Classic"',
    slug: "ikat-pinggang-buckle-classic",
    description:
      "Ikat pinggang kulit dengan buckle brass yang di-brush manual. Panjang dapat disesuaikan, cocok formal maupun kasual.",
    price: 169_000,
    stock: 16,
    categorySlug: "aksesoris",
  },
  // ---- Gadget ----
  {
    name: 'TWS Earbuds "Pulse Air"',
    slug: "tws-earbuds-pulse-air",
    description:
      "Earbuds TWS dengan driver 13mm,ANC hybrid, dan total playtime 28 jam dengan charging case. Latency rendah untuk gaming, IPX5 tahan keringat.",
    price: 449_000,
    compareAtPrice: 539_000,
    stock: 30,
    featured: true,
    categorySlug: "gadget",
  },
  {
    name: 'Portable Speaker "Boom Mini"',
    slug: "portable-speaker-boom-mini",
    description:
      "Speaker portabel 10W dengan bass yang menggelegar untuk ukurannya. Bluetooth 5.3, IPX7 waterproof, dan 16 jam playtime.",
    price: 529_000,
    compareAtPrice: 582_000,
    stock: 20,
    featured: true,
    categorySlug: "gadget",
  },
  {
    name: 'Powerbank "ChargeGo 10K"',
    slug: "powerbank-chargego-10k",
    description:
      "Powerbank 10.000mAh dengan display digital, PD 20W fast charging, dan dua port output. Body aluminium yang tipis dan kuat.",
    price: 299_000,
    stock: 45,
    categorySlug: "gadget",
  },
  {
    name: 'Smartwatch "Pace One"',
    slug: "smartwatch-pace-one",
    description:
      "Smartwatch dengan AMOLED 1.43 inci, GPS built-in, monitor detak jantung & SpO2, plus 100+ mode olahraga. Baterai 10 hari, strap kulit walnut.",
    price: 899_000,
    compareAtPrice: 1_061_000,
    stock: 12,
    featured: true,
    categorySlug: "gadget",
  },
  // ---- Rumah ----
  {
    name: 'Mug Keramik "Morning Ritual"',
    slug: "mug-keramik-morning-ritual",
    description:
      "Mug keramik 320ml buatan tangan dengan glaze terracotta yang unik di tiap unit. Aman untuk microwave dan dishwasher.",
    price: 75_000,
    stock: 50,
    categorySlug: "rumah",
  },
  {
    name: 'Lilin Aromaterapi "Soy Calm"',
    slug: "lilin-aromaterapi-soy-calm",
    description:
      "Lilin soy wax dengan essential oil alami aroma sandalwood & vanilla. Burn time hingga 35 jam dalam jar amber yang reusable.",
    price: 98_000,
    stock: 38,
    categorySlug: "rumah",
  },
  {
    name: 'Lampu Meja "Glow Nook"',
    slug: "lampu-meja-glow-nook",
    description:
      "Lampu meja kayu dengan kap kain linen yang menghasilkan cahaya hangat. Dilengkapi dimmer 3 tingkat untuk suasana yang pas.",
    price: 349_000,
    compareAtPrice: 398_000,
    stock: 5,
    featured: true,
    categorySlug: "rumah",
  },
  {
    name: 'Selimut Rajut "Cozy Weave"',
    slug: "selimut-rajut-cozy-weave",
    description:
      "Selimut rajut chunky 130x170cm dari serat akrilik premium yang lembut dan tidak berbulu. Warna caramel yang hangat.",
    price: 429_000,
    stock: 4,
    categorySlug: "rumah",
  },
];

const REVIEW_POOL: { rating: number; comment: string }[] = [
  { rating: 5, comment: "Kualitas di atas ekspektasi, packing rapi dan pengiriman cepat. Recommended banget!" },
  { rating: 5, comment: "Sudah repeat order, konsisten bagus. Materi premium." },
  { rating: 4, comment: "Barang sesuai deskripsi. Pengiriman agak lama tapi tetap aman." },
  { rating: 4, comment: "Desainnya elegan, fungsional. Worth the price." },
  { rating: 5, comment: "CS ramah, barang datang tanpa cacat. Pasti order lagi." },
  { rating: 3, comment: "Cukup baik untuk harganya, tapi ada sedikit perbedaan warna dengan foto." },
];

async function main() {
  console.log("Seeding KAVANA…");

  // Wipe in dependency order
  await db.review.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.session.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  // ---- Users ----
  const admin = await db.user.create({
    data: {
      email: "admin@kavana.id",
      name: "Admin Kavana",
      password: hashPassword("admin123"),
      role: "ADMIN",
      phone: "081200000001",
    },
  });
  const budi = await db.user.create({
    data: {
      email: "budi@kavana.id",
      name: "Budi Santoso",
      password: hashPassword("budi123"),
      role: "CUSTOMER",
      phone: "081234567890",
      address: "Jl. Melati No. 12, RT 03 RW 05",
      city: "Jakarta Selatan",
    },
  });
  const sari = await db.user.create({
    data: {
      email: "sari@kavana.id",
      name: "Sari Rahma",
      password: hashPassword("sari123"),
      role: "CUSTOMER",
      phone: "081298765432",
      address: "Jl. Kenanga Indah No. 8",
      city: "Bandung",
    },
  });
  const dimas = await db.user.create({
    data: {
      email: "dimas@kavana.id",
      name: "Dimas Prakoso",
      password: hashPassword("dimas123"),
      role: "CUSTOMER",
      phone: "081377712345",
    },
  });
  console.log("Users seeded:", admin.email, budi.email, sari.email, dimas.email);

  // ---- Categories ----
  const catMap = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await db.category.create({ data: c });
    catMap.set(c.slug, created.id);
  }
  console.log("Categories seeded:", catMap.size);

  // ---- Products ----
  const productIds: string[] = [];
  for (const p of PRODUCTS) {
    const created = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        images: JSON.stringify([`/images/products/${p.slug}.png?v=2`]),
        featured: p.featured ?? false,
        categoryId: catMap.get(p.categorySlug)!,
      },
    });
    productIds.push(created.id);
  }
  console.log("Products seeded:", productIds.length);

  // ---- Reviews (customers review some products) ----
  const reviewers = [budi, sari, dimas];
  let reviewCount = 0;
  for (let i = 0; i < productIds.length; i++) {
    // seed 1-3 reviews per product, deterministic-ish spread
    const n = (i % 3) + 1;
    for (let r = 0; r < n; r++) {
      const user = reviewers[(i + r) % reviewers.length];
      const pool = REVIEW_POOL[(i + r * 2) % REVIEW_POOL.length];
      try {
        await db.review.create({
          data: {
            userId: user.id,
            productId: productIds[i],
            rating: pool.rating,
            comment: pool.comment,
          },
        });
        reviewCount++;
      } catch {
        // unique constraint skip
      }
    }
  }
  console.log("Reviews seeded:", reviewCount);

  // ---- Historical orders (for admin analytics) ----
  const statuses: string[] = ["COMPLETED", "COMPLETED", "COMPLETED", "SHIPPED", "PAID", "COMPLETED", "SHIPPED", "COMPLETED"];
  const orderers = [budi, sari, dimas, budi, sari, budi, dimas, sari];
  let orderCount = 0;

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const user = orderers[i];
    // pick 1-3 distinct products
    const picks: SeedProduct[] = [];
    const count = (i % 2) + 1;
    for (let j = 0; j <= count; j++) {
      const prod = PRODUCTS[(i * 3 + j * 5) % PRODUCTS.length];
      if (!picks.find((p) => p.slug === prod.slug)) picks.push(prod);
    }
    const items = picks.map((p) => ({
      productIndex: PRODUCTS.indexOf(p),
      quantity: ((i + j2(i)) % 2) + 1,
    }));

    const subtotal = items.reduce((sum, it) => sum + PRODUCTS[it.productIndex].price * it.quantity, 0);
    const shipping = subtotal >= 500_000 ? 0 : 25_000;
    const createdAt = new Date(Date.now() - (i + 1) * 36 * 60 * 60 * 1000); // spread over ~12 days

    const order = await db.order.create({
      data: {
        orderNumber: `KVN-HIST-${String(1000 + i)}`,
        userId: user.id,
        status,
        customerName: user.name,
        phone: user.phone ?? "080000000000",
        address: user.address ?? "Jl. Contoh Alamat No. 1",
        city: user.city ?? "Jakarta",
        postalCode: null,
        subtotal,
        shippingCost: shipping,
        total: subtotal + shipping,
        paymentMethod: ["EWALLET", "VA_BCA", "CARD", "VA_MANDIRI"][i % 4],
        paymentRef: `PAY-HIST${String(1000 + i)}`,
        paidAt: status !== "PENDING" ? createdAt : null,
        createdAt,
        items: {
          create: items.map((it) => {
            const p = PRODUCTS[it.productIndex];
            return {
              productId: productIds[it.productIndex],
              name: p.name,
              price: p.price,
              image: `/images/products/${p.slug}.png`,
              quantity: it.quantity,
            };
          }),
        },
      },
    });
    void order;
    orderCount++;
  }
  console.log("Historical orders seeded:", orderCount);
  console.log("DONE.");
}

function j2(i: number): number {
  return (i * 7) % 3;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
