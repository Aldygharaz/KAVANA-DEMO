"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/components/store/use-hydrated";

/** Toggle gelap/terang — ikon berganti dengan transisi rotasi halus. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Guard hidrasi: ikon hanya tampil pasti setelah client ter-mount
  const mounted = useHydrated();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className={
        "relative h-9 w-9 rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground " +
        (className ?? "")
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun
        className={
          "h-[18px] w-[18px] transition-all duration-300 " +
          (isDark ? "rotate-90 scale-0" : "rotate-0 scale-100")
        }
      />
      <Moon
        className={
          "absolute h-[18px] w-[18px] transition-all duration-300 " +
          (isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0")
        }
      />
    </Button>
  );
}
