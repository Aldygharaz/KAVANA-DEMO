"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/** Thumbnail produk admin dengan fallback placeholder */
export function ProductThumb({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className={cn(
          "flex items-center justify-center rounded-md border bg-secondary text-muted-foreground",
          className
        )}
      >
        <Package className="size-1/2" />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("rounded-md border bg-secondary object-cover", className)}
    />
  );
}
