"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, Package, LayoutDashboard, LogOut, UserRound, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthUser } from "@/hooks/use-auth-user";

export function UserMenu() {
  const { user, loading, logout: authLogout } = useAuthUser();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authLogout();
      toast.success("Berhasil keluar.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Gagal logout. Coba lagi.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return <span className="h-10 w-10 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/login">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Masuk</span>
          </Link>
        </Button>
        <Button asChild size="sm" className="rounded-full">
          <Link href="/register">Daftar</Link>
        </Button>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu akun"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/orders">
            <Package className="h-4 w-4" /> Pesanan Saya
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/akun">
            <UserCog className="h-4 w-4" /> Akun Saya
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" /> Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} disabled={loggingOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> {loggingOut ? "Keluar…" : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
