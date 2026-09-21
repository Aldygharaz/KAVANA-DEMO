"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Loader2,
  LogIn,
  MessageSquareText,
  Star,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHydrated } from "@/components/store/use-hydrated";
import { formatRelative } from "@/lib/format";
import type { ReviewData } from "@/components/store/storefront-types";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  reviews: ReviewData[];
  avgRating: number | null;
  reviewCount: number;
}

const HELPFUL_KEY = "kavana-helpful"; // localStorage: daftar id ulasan yang disukai user ini

function readHelpfulList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HELPFUL_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeHelpfulList(ids: string[]) {
  try {
    window.localStorage.setItem(HELPFUL_KEY, JSON.stringify(ids));
  } catch {
    // localStorage penuh / diblokir — abaikan (mode demo)
  }
}

/** Ringkasan distribusi rating (bar 5→1) */
function RatingSummary({ reviews, avgRating }: { reviews: ReviewData[]; avgRating: number | null }) {
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length;

  return (
    <div className="flex items-center gap-5 rounded-xl border border-border bg-secondary/40 p-4 sm:gap-8 sm:p-5">
      <div className="shrink-0 text-center">
        <p className="text-4xl font-extrabold tracking-tight">{(avgRating ?? 0).toFixed(1)}</p>
        <p className="mt-1 text-sm text-amber-500" aria-label={`Rata-rata ${(avgRating ?? 0).toFixed(1)} dari 5`}>
          {"★".repeat(Math.round(avgRating ?? 0))}
          <span className="text-muted-foreground/40">{"★".repeat(5 - Math.round(avgRating ?? 0))}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{total} ulasan</p>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5" role="img" aria-label="Distribusi rating per bintang">
        {dist.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-8 shrink-0 text-muted-foreground">{star} ★</span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductReviews({ slug, reviews, avgRating, reviewCount }: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const mounted = useHydrated();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // --- Vote "Membantu" ---
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(reviews.map((r) => [r.id, r.helpfulCount]))
  );
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    if (mounted) setMyVotes(readHelpfulList());
  }, [mounted]);

  const toggleHelpful = useCallback(
    async (reviewId: string) => {
      if (!user) {
        toast.info("Masuk untuk menandai ulasan membantu.");
        return;
      }
      if (voting) return;
      const liked = myVotes.includes(reviewId);
      const action = liked ? "unlike" : "like";
      setVoting(reviewId);

      // Optimistic update
      setMyVotes((prev) => {
        const next = liked ? prev.filter((id) => id !== reviewId) : [...prev, reviewId];
        writeHelpfulList(next);
        return next;
      });
      setVoteCounts((prev) => ({
        ...prev,
        [reviewId]: Math.max(0, (prev[reviewId] ?? 0) + (liked ? -1 : 1)),
      }));

      try {
        const r = await fetch(`/api/reviews/${reviewId}/helpful`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = r.ok ? await r.json() : await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error ?? "gagal");
        if (typeof data?.helpfulCount === "number") {
          setVoteCounts((prev) => ({ ...prev, [reviewId]: data.helpfulCount }));
        }
      } catch {
        // Rollback bila gagal
        setMyVotes((prev) => {
          const next = liked ? [...prev, reviewId] : prev.filter((id) => id !== reviewId);
          writeHelpfulList(next);
          return next;
        });
        setVoteCounts((prev) => ({
          ...prev,
          [reviewId]: Math.max(0, (prev[reviewId] ?? 0) + (liked ? 1 : -1)),
        }));
        toast.error("Gagal menandai ulasan. Coba lagi.");
      } finally {
        setVoting(null);
      }
    },
    [user, voting, myVotes]
  );

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (trimmed.length < 3) {
      setCommentError("Komentar minimal 3 karakter.");
      return;
    }
    if (trimmed.length > 1000) {
      setCommentError("Komentar maksimal 1000 karakter.");
      return;
    }
    setCommentError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: trimmed }),
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Gagal mengirim ulasan. Coba lagi.");
        return;
      }
      toast.success("Ulasan berhasil dikirim!", { description: "Terima kasih atas penilaianmu." });
      setComment("");
      setRating(5);
      router.refresh(); // muat ulang data server (daftar & rata-rata ulasan)
    } catch {
      toast.error("Gagal mengirim ulasan. Periksa koneksi kamu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-heading" className="text-xl font-extrabold tracking-tight">
          Ulasan Pembeli
        </h2>
        {reviewCount > 0 && (
          <p className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-amber-500">★</span>
            <span className="font-bold">{(avgRating ?? 0).toFixed(1)}</span>
            <span className="text-muted-foreground">· {reviewCount} ulasan</span>
          </p>
        )}
      </div>

      {/* Ringkasan distribusi rating */}
      {reviewCount > 0 && (
        <div className="mt-4">
          <RatingSummary reviews={reviews} avgRating={avgRating} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Form ulasan (jika login) */}
        <div className="lg:col-span-2">
          {authLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ) : user ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareText className="h-4 w-4 text-primary" /> Tulis Ulasan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitReview} className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Rating kamu</span>
                    <div className="mt-1 flex items-center gap-1" role="radiogroup" aria-label="Pilih rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={rating === n}
                          aria-label={`Beri ${n} bintang`}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(n)}
                          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
                        >
                          <Star
                            className={
                              n <= (hoverRating || rating)
                                ? "h-6 w-6 fill-amber-500 text-amber-500"
                                : "h-6 w-6 text-muted-foreground/40"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-comment" className="text-sm font-medium">
                      Komentar
                    </label>
                    <Textarea
                      id="review-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Bagaimana pengalamanmu dengan produk ini?"
                      rows={4}
                      maxLength={1000}
                      className="mt-1 resize-none"
                      aria-invalid={Boolean(commentError)}
                    />
                    {commentError && (
                      <p className="mt-1 text-xs font-medium text-destructive" role="alert">
                        {commentError}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full rounded-full">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Kirim Ulasan
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    1 ulasan per produk — mengirim lagi akan memperbarui ulasanmu.
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <LogIn className="h-5 w-5 text-muted-foreground" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Masuk untuk menulis ulasan dan membantu pembeli lain.
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/login?next=/products/${slug}`}>Masuk untuk Menulis Ulasan</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Daftar ulasan */}
        <div className="lg:col-span-3">
          {reviews.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
              <MessageSquareText className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada ulasan untuk produk ini. Jadi yang pertama!
              </p>
            </div>
          ) : (
            <ul className="max-h-[520px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {reviews.map((rv) => {
                const liked = mounted && myVotes.includes(rv.id);
                const count = voteCounts[rv.id] ?? rv.helpfulCount;
                return (
                  <li key={rv.id}>
                    <Card className="transition-colors hover:border-primary/30">
                      <CardContent className="flex gap-3 p-4">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-secondary text-xs font-bold text-foreground">
                            {rv.userName.slice(0, 2).toUpperCase()}
                            <UserRound className="hidden" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                            <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                              <span className="truncate">{rv.userName}</span>
                              {rv.verified && (
                                <span
                                  className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
                                  title="Pembelian terverifikasi"
                                >
                                  <BadgeCheck className="h-3 w-3" /> Pembeli
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(rv.createdAt)}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-amber-500" aria-label={`Rating ${rv.rating} dari 5`}>
                            {"★".repeat(rv.rating)}
                            <span className="text-muted-foreground/40">{"★".repeat(5 - rv.rating)}</span>
                          </p>
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                            {rv.comment}
                          </p>
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => toggleHelpful(rv.id)}
                              disabled={voting === rv.id}
                              aria-pressed={liked}
                              aria-label={`Tandai ulasan ini membantu (${count} orang setuju)`}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
                                liked
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                              )}
                            >
                              <ThumbsUp
                                className={cn("h-3.5 w-3.5", liked && "fill-primary/20")}
                              />
                              Membantu{count > 0 ? ` (${count})` : ""}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
