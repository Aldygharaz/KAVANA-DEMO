import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_LABEL,
} from "@/components/store/storefront-types";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-semibold", ORDER_STATUS_BADGE_CLASS[status], className)}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
