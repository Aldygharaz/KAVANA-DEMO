import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string | number;
  onChange?: (value: string) => void;
  onValueChange?: (numericValue: number) => void;
}

export function formatRupiahInput(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const cleaned = String(value).replace(/\D/g, "");
  if (!cleaned) return "";
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

export function parseRupiahInput(formatted: string | undefined | null): number {
  if (!formatted) return 0;
  const cleaned = String(formatted).replace(/\D/g, "");
  return cleaned ? Number(cleaned) : 0;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, onValueChange, placeholder = "0", disabled, ...props }, ref) => {
    const formattedValue = formatRupiahInput(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, "");
      const formatted = formatRupiahInput(digits);
      const numeric = digits ? Number(digits) : 0;

      if (onChange) {
        onChange(formatted);
      }
      if (onValueChange) {
        onValueChange(numeric);
      }
    };

    return (
      <div className="relative w-full">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground select-none"
          aria-hidden="true"
        >
          Rp
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={formattedValue}
          onChange={handleChange}
          data-slot="currency-input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
            "dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent pl-10 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
