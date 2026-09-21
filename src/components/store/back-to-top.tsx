"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tombol kembali ke atas — muncul setelah scroll melewati 1.5 layar. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Kembali ke atas"
      tabIndex={visible ? 0 : -1}
      className={
        "fixed bottom-20 right-5 z-40 h-11 w-11 rounded-full border border-border/60 bg-card/90 text-foreground shadow-lg backdrop-blur transition-all duration-300 hover:bg-secondary md:bottom-5 " +
        (visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0")
      }
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
