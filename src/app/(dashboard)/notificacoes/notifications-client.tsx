"use client";

import { useMemo, useState, useCallback, useOptimistic, startTransition } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import Link from "next/link";

import {
  ArrowRight,
  Bell,
  BellRinging,
  CalendarCheck,
  CheckCircle,
  Clock,
  Flag,
  TriangleAlertIcon,
  Warning,
  XCircle,
  X,
} from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./actions";
import { PushNotificationManager } from "@/features/notifications/components/push-notification-manager";

/* ─── Types ─── */

type Priority = "urgent" | "attention" | "info";
type FilterType = "all" | "unread" | "urgent";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  leadId: string | null;
}

/* ─── Helpers ─── */

function priorityFor(type: string): Priority {
  if (["lead_unworked", "lead_stalled", "document_rejected"].includes(type))
    return "urgent";
  if (
    [
      "agent.lead_assigned",
      "lead_feedback_reminder",
      "client_renewal_reminder",
    ].includes(type)
  )
    return "attention";
  return "info";
}

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Ação necessária", color: "destructive" },
  attention: { label: "Acompanhar", color: "warning" },
  info: { label: "Informativo", color: "default" },
};

function getNotificationIcon(type: string) {
  if (type === "lead_unworked") return Warning;
  if (type === "lead_stalled") return TriangleAlertIcon;
  if (type === "document_rejected") return XCircle;
  if (type === "agent.lead_assigned") return Bell;
  if (type === "lead_feedback_reminder") return Clock;
  if (type === "client_renewal_reminder") return CalendarCheck;
  if (type === "lead_reengagement") return BellRinging;
  return Bell;
}

function destinationHref(type: string, leadId: string | null): string | null {
  if (!leadId) return null;
  return `/leads/${leadId}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;
  if (isYesterday) return `Ontem ${time}`;

  const dayName = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7)
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${time}`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function groupByDate(items: NotificationItem[]): [string, NotificationItem[]][] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const groups: Record<string, NotificationItem[]> = {
    Hoje: [],
    Ontem: [],
    "Esta semana": [],
    Anterior: [],
  };

  for (const item of items) {
    const d = new Date(item.createdAt);
    if (isSameDay(d, now)) groups["Hoje"].push(item);
    else if (isSameDay(d, yesterday)) groups["Ontem"].push(item);
    else if (d >= startOfWeek) groups["Esta semana"].push(item);
    else groups["Anterior"].push(item);
  }

  return Object.entries(groups).filter(([, arr]) => arr.length > 0);
}

/* ─── Localized container for safe ID generation ─── */

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Não lidas" },
  { key: "urgent", label: "Ação necessária" },
];

/* ─── Filter Pill ─── */

function FilterPill({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="relative z-10">{label}</span>
      {count > 0 && (
        <span
          className={`relative z-10 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted-foreground/15 text-muted-foreground"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/* ─── Notification Card ─── */

function NotificationCard({
  item,
  onMarkRead,
  isReadOptimistic,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  isReadOptimistic: boolean;
}) {
  const priority = priorityFor(item.type);
  const Icon = getNotificationIcon(item.type);
  const href = destinationHref(item.type, item.leadId);
  const isRead = isReadOptimistic || item.readAt !== null;

  const borderColor =
    priority === "urgent"
      ? "border-l-destructive"
      : priority === "attention"
        ? "border-l-warning"
        : "border-l-primary/40";

  const dotColor = isRead
    ? "bg-muted-foreground/30"
    : priority === "urgent"
      ? "bg-destructive"
      : priority === "attention"
        ? "bg-warning"
        : "bg-primary";

  const iconColor = isRead
    ? "text-muted-foreground/40"
    : priority === "urgent"
      ? "text-destructive"
      : priority === "attention"
        ? "text-warning"
        : "text-primary";

  const statusLabel = PRIORITY_META[priority].label;
  const badgeVariant = isRead
    ? "outline"
    : priority === "urgent"
      ? "destructive"
      : priority === "attention"
        ? "warning"
        : "secondary";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative border-l-4 ${borderColor} bg-card transition-all duration-150 hover:bg-muted/30`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
        {/* Icon */}
        <div
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border ${iconColor.replace("text-", "border-").replace("/40", "/20")} bg-background/60 transition-colors duration-150`}
        >
          <Icon className={`size-4 ${iconColor}`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium leading-tight ${isRead ? "text-muted-foreground/70" : "text-foreground"}`}>
              {item.title}
            </p>
            <Badge
              variant={badgeVariant}
              className={`rounded-full text-[10px] leading-none ${isRead ? "opacity-50" : ""}`}
            >
              {statusLabel}
            </Badge>
          </div>

          <p
            className={`mt-1 text-xs leading-relaxed ${isRead ? "text-muted-foreground/50" : "text-muted-foreground"}`}
          >
            {item.message}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {href && (
              <Link
                href={href}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors duration-150 hover:bg-primary/10"
              >
                Ver lead
                <ArrowRight className="size-3" />
              </Link>
            )}

            {!isRead && (
              <button
                type="button"
                onClick={() => onMarkRead(item.id)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted-foreground/10 hover:text-foreground"
              >
                <CheckCircle className="size-3" />
                Marcar como lida
              </button>
            )}

            {isRead && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/40">
                <CheckCircle className="size-3" />
                Lida
              </span>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <time dateTime={new Date(item.createdAt).toISOString()} className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground/60">
          {formatTimestamp(new Date(item.createdAt))}
        </time>
      </div>
    </motion.article>
  );
}

/* ─── Date Group ─── */

function DateGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 px-1 pb-2 pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </h3>
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-muted-foreground/10 text-[10px] font-medium text-muted-foreground/60">
          {count}
        </span>
        <div className="flex-1 border-t border-border/40" />
      </div>
      <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Empty State ─── */

function EmptyState({ filter }: { filter: FilterType }) {
  const config =
    filter === "unread"
      ? {
          icon: CheckCircle,
          title: "Tudo lido!",
          description: "Você está em dia com todas as notificações.",
        }
      : filter === "urgent"
        ? {
            icon: Flag,
            title: "Nada urgente",
            description: "Não há notificações que exigem ação imediata.",
          }
        : {
            icon: Bell,
            title: "Nenhuma notificação",
            description:
              "Você verá aqui alertas de leads, tarefas e atualizações do sistema.",
          };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
        <Icon className="size-6 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{config.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {config.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Stats Bar ─── */

function StatsBar({
  total,
  unread,
  urgent,
}: {
  total: number;
  unread: number;
  urgent: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        {total} {total === 1 ? "total" : "totais"}
      </span>
      {unread > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          {unread} {unread === 1 ? "não lida" : "não lidas"}
        </span>
      )}
      {urgent > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-destructive" />
          {urgent} {urgent === 1 ? "urgente" : "urgentes"}
        </span>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function NotificationsClient({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [optimisticReads, addOptimisticRead] = useOptimistic<
    Set<string>,
    string
  >(new Set(), (state, id) => new Set(state).add(id));

  const unreadCount = useMemo(
    () =>
      notifications.filter((n) => !n.readAt && !optimisticReads.has(n.id))
        .length,
    [notifications, optimisticReads]
  );

  const urgentCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          priorityFor(n.type) === "urgent" &&
          !n.readAt &&
          !optimisticReads.has(n.id)
      ).length,
    [notifications, optimisticReads]
  );

  const visible = useMemo(() => {
    return notifications.filter((n) => {
      const isRead = !!n.readAt || optimisticReads.has(n.id);
      if (filter === "unread") return !isRead;
      if (filter === "urgent")
        return priorityFor(n.type) === "urgent" && !isRead;
      return true;
    });
  }, [notifications, filter, optimisticReads]);

  const grouped = useMemo(() => groupByDate(visible), [visible]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      startTransition(() => {
        addOptimisticRead(id);
      });
      const form = new FormData();
      form.set("notificationId", id);
      await markNotificationReadAction(form);
    },
    [addOptimisticRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.readAt && !optimisticReads.has(n.id))
      .map((n) => n.id);

    startTransition(() => {
      for (const id of unreadIds) {
        addOptimisticRead(id);
      }
    });

    await markAllNotificationsReadAction();
  }, [notifications, optimisticReads, addOptimisticRead]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pb-8 pt-4 lg:px-6 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Centro de notificações
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Notificações
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Alertas, tarefas e atualizações organizadas por relevância.
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.form
            action={handleMarkAllRead}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              size="sm"
              type="submit"
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <CheckCircle className="size-3.5" />
              Marcar todas como lidas
            </Button>
          </motion.form>
        )}
      </div>

      {/* Stats + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatsBar
          total={notifications.length}
          unread={unreadCount}
          urgent={urgentCount}
        />

        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              active={filter === f.key}
              count={
                f.key === "all"
                  ? notifications.length
                  : f.key === "unread"
                    ? unreadCount
                    : urgentCount
              }
              label={f.label}
              onClick={() => setFilter(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Notification List */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {grouped.length > 0 ? (
            grouped.map(([label, items]) => (
              <DateGroup key={label} label={label} count={items.length}>
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      onMarkRead={handleMarkRead}
                      isReadOptimistic={optimisticReads.has(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </DateGroup>
            ))
          ) : (
            <EmptyState filter={filter} />
          )}
        </AnimatePresence>
      </LayoutGroup>

      {/* Push Notification Settings */}
      <div className="pt-4">
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span className="inline-flex size-5 items-center justify-center rounded-full border border-border/60 transition-colors duration-150 group-hover:border-muted-foreground/40">
              <X className="size-3 transition-transform duration-200 group-open:rotate-45" />
            </span>
            Configurações de notificações push
          </summary>
          <div className="mt-3">
            <PushNotificationManager />
          </div>
        </details>
      </div>
    </main>
  );
}
