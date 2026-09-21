import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { db } from "@/lib/db";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const TestimonialsSection = async () => {
  // Ulasan asli dari DB: rating tertinggi + terbaru, dengan komentar cukup panjang
  const reviews = await db.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: "" } },
    orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  if (reviews.length === 0) return null;

  // Distribusi awal avatar agar bervariasi (3 warna hangat dari palet brand)
  const AVATAR_TONES = [
    "bg-primary/15 text-primary",
    "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  ];

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="border-y border-border bg-secondary/50"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge
              variant="outline"
              className="mb-3 gap-1.5 rounded-full border-primary/30 bg-background px-3 py-1 text-xs font-semibold text-primary"
            >
              <Quote className="h-3 w-3" /> Testimoni
            </Badge>
            <h2
              id="testimonials-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Kata Mereka yang Sudah Belanja
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ulasan asli dari pelanggan KAVANA — diambil langsung dari produk.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => {
            const initials = (r.user.name ?? "?")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <figure
                key={r.id}
                className="group flex h-full flex-col rounded-xl border border-border bg-background p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex items-center gap-0.5"
                    aria-label={`Rating ${r.rating} dari 5`}
                  >
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        aria-hidden
                        className={cn(
                          "size-3.5",
                          s < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <Quote
                    aria-hidden
                    className="size-5 text-primary/25 transition-colors group-hover:text-primary/40"
                  />
                </div>

                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  “{r.comment}”
                </blockquote>

                <figcaption className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                  <Avatar className="size-9 border border-border">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-bold",
                        AVATAR_TONES[i % AVATAR_TONES.length]
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {r.user.name}
                    </p>
                    <Link
                      href={`/products/${r.product.slug}`}
                      className="block max-w-52 truncate text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {r.product.name}
                    </Link>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
};
