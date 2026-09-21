"use client";

import { Star, StarHalf } from "lucide-react";

export function StarRating({
  rating,
  size = "sm",
  showValue = false,
}: {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const half = clamped - full >= 0.25 && clamped - full < 0.75;
  const rounded = half ? full + 1 : Math.round(clamped);
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rating ${clamped.toFixed(1)} dari 5`}>
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) {
            return <Star key={i} className={`${cls} fill-amber-500 text-amber-500`} />;
          }
          if (i === full && half) {
            return (
              <span key={i} className="relative inline-flex">
                <Star className={`${cls} text-muted-foreground/40`} />
                <StarHalf className={`${cls} absolute inset-0 fill-amber-500 text-amber-500`} />
              </span>
            );
          }
          return <Star key={i} className={`${cls} text-muted-foreground/40`} />;
        })}
      </span>
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground">
          {clamped > 0 ? clamped.toFixed(1) : "Baru"}{rounded ? "" : ""}
        </span>
      )}
    </span>
  );
}
