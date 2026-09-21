import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Keranjang", "Checkout", "Pembayaran"] as const;

/**
 * Indikator langkah alur belanja (Keranjang → Checkout → Pembayaran).
 * @param current indeks langkah aktif (0-based)
 */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Progres checkout">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3.5 sm:text-xs",
                  active && "border-primary bg-primary text-primary-foreground shadow-sm",
                  done && "border-primary/30 bg-primary/10 text-primary",
                  !active && !done && "border-border text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    active && "bg-primary-foreground text-primary",
                    done && "bg-primary text-primary-foreground",
                    !active && !done && "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {done ? <Check className="size-3" aria-hidden /> : i + 1}
                </span>
                <span className="truncate">{label}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn("h-px w-5 shrink-0 sm:w-8", done ? "bg-primary/50" : "bg-border")}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
