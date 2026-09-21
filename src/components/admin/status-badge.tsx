import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

/** Warna badge status — warm palette, tanpa biru/indigo */
export const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 border-amber-600/30 dark:text-amber-400 dark:border-amber-500/30",
  PAID: "bg-emerald-500/15 text-emerald-700 border-emerald-600/30 dark:text-emerald-400 dark:border-emerald-500/30",
  SHIPPED: "bg-orange-500/15 text-orange-700 border-orange-600/30 dark:text-orange-400 dark:border-orange-500/30",
  COMPLETED: "bg-primary/15 text-primary border-primary/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = (Object.keys(STATUS_BADGE_CLASS) as OrderStatus[]).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "PENDING";
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_BADGE_CLASS[key], "font-medium whitespace-nowrap", className)}
    >
      {ORDER_STATUS_LABEL[key]}
    </Badge>
  );
}
