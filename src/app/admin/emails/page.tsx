"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  CreditCard,
  Loader2,
  Mail,
  MailOpen,
  PackageCheck,
  PackageX,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

type EmailType =
  | "PASSWORD_RESET"
  | "WELCOME"
  | "ORDER_PAID"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED";

interface EmailLogItem {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  type: string;
  orderId: string | null;
  orderNumber: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_META: Record<
  EmailType,
  { label: string; icon: typeof Mail; className: string }
> = {
  PASSWORD_RESET: {
    label: "Reset Kata Sandi",
    icon: RotateCcw,
    className:
      "border-amber-600/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  WELCOME: {
    label: "Selamat Datang",
    icon: Sparkles,
    className:
      "border-emerald-600/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  ORDER_PAID: {
    label: "Pesanan Dibayar",
    icon: CreditCard,
    className:
      "border-primary/30 bg-primary/10 text-primary",
  },
  ORDER_SHIPPED: {
    label: "Pesanan Dikirim",
    icon: PackageCheck,
    className:
      "border-sky-600/30 bg-sky-500/15 text-sky-700 dark:text-sky-400",
  },
  ORDER_CANCELLED: {
    label: "Pesanan Dibatalkan",
    icon: PackageX,
    className:
      "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type as EmailType];
  if (!meta) return <Badge variant="secondary">{type}</Badge>;
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full font-medium", meta.className)}
    >
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}

function EmailsSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [type, setType] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (unreadOnly) params.set("unread", "1");
      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      const data = (await res.json().catch(() => null)) as {
        emails?: EmailLogItem[];
        total?: number;
        totalPages?: number;
        unreadCount?: number;
        error?: string;
      } | null;
      if (!res.ok || !data) {
        toast.error(data?.error ?? "Gagal memuat email");
        return;
      }
      setEmails(data.emails ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }, [type, unreadOnly, page]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const markRead = useCallback(
    async (email: EmailLogItem) => {
      if (email.readAt) return;
      // Optimistic update
      setEmails((prev) =>
        prev.map((e) =>
          e.id === email.id
            ? { ...e, readAt: new Date().toISOString() }
            : e
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        const res = await fetch(`/api/admin/emails/${email.id}/read`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
      } catch {
        // Rollback
        setEmails((prev) =>
          prev.map((e) =>
            e.id === email.id ? { ...e, readAt: null } : e
          )
        );
        setUnreadCount((c) => c + 1);
      }
    },
    []
  );

  const toggleExpand = (email: EmailLogItem) => {
    const next = expandedId === email.id ? null : email.id;
    setExpandedId(next);
    if (next === email.id) {
      // Membuka email = menandai dibaca
      markRead(email);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/admin/emails/read-all", { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        marked?: number;
        error?: string;
      } | null;
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal menandai email");
        return;
      }
      toast.success(
        data?.marked
          ? `${data.marked} email ditandai dibaca`
          : "Tidak ada email baru"
      );
      loadEmails();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteEmail = async (email: EmailLogItem) => {
    setDeletingId(email.id);
    try {
      const res = await fetch(`/api/admin/emails/${email.id}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal menghapus email");
        return;
      }
      if (!email.readAt) setUnreadCount((c) => Math.max(0, c - 1));
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Email dihapus");
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Email
            {unreadCount > 0 && (
              <Badge className="rounded-full px-2">{unreadCount} baru</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Outbox email mock — bukti notifikasi otomatis (demo; produksi: SMTP).
          </p>
        </div>
        <Button
          variant="outline"
          onClick={markAllRead}
          disabled={markingAll || unreadCount === 0}
        >
          {markingAll ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <CheckCheck className="size-4" aria-hidden />
          )}
          Tandai Semua Dibaca
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter tipe email" className="w-52">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tipe</SelectItem>
            {(Object.keys(TYPE_META) as EmailType[]).map((k) => (
              <SelectItem key={k} value={k}>
                {TYPE_META[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setUnreadOnly((v) => !v);
            setPage(1);
          }}
          aria-pressed={unreadOnly}
          className="rounded-full"
        >
          {unreadOnly ? (
            <Mail className="size-4" aria-hidden />
          ) : (
            <MailOpen className="size-4" aria-hidden />
          )}
          Belum dibaca
        </Button>
      </div>

      {/* Daftar email */}
      {loading && emails.length === 0 ? (
        <EmailsSkeleton />
      ) : emails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Mail className="size-6" aria-hidden />
            </span>
            <p className="font-medium">Belum ada email</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Email akan otomatis masuk ke sini saat ada pesanan dibayar,
              dikirim, reset kata sandi, atau pendaftaran pengguna baru.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {emails.map((email) => {
            const expanded = expandedId === email.id;
            const unread = !email.readAt;
            return (
              <Card
                key={email.id}
                className={cn(
                  "transition-colors",
                  unread
                    ? "border-primary/40 shadow-sm"
                    : "opacity-90 hover:opacity-100"
                )}
              >
                <CardContent className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    onClick={() => toggleExpand(email)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpand(email);
                      }
                    }}
                    className="flex w-full cursor-pointer flex-col gap-2 rounded-xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {unread && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Belum dibaca"
                        />
                      )}
                      <TypeBadge type={email.type} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          unread ? "font-semibold" : "text-muted-foreground"
                        )}
                      >
                        {email.subject}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelative(email.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">Kepada: {email.toEmail}</span>
                      {email.orderNumber && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 rounded-full font-mono text-[10px]"
                        >
                          {email.orderNumber}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t px-4 pb-4 pt-3">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                        {email.body}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 px-3 pb-3">
                    {!unread && (
                      <span className="mr-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <MailOpen className="size-3.5" aria-hidden />
                        Dibaca
                      </span>
                    )}
                    {!email.readAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(email);
                        }}
                      >
                        <MailOpen className="size-3.5" aria-hidden />
                        Tandai dibaca
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmail(email);
                      }}
                      aria-label={`Hapus email ${email.subject}`}
                    >
                      {deletingId === email.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="size-3.5" aria-hidden />
                      )}
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Menampilkan {emails.length} dari {total} email
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <span className="px-2 text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
