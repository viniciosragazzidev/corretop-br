"use client";

import { Bell, BookOpen } from "@/components/huge-icons";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { useNotificationCount } from "@/components/providers/notification-count-provider";

type DashboardHeaderProps = {
  breadcrumb: string;
  title: string;
  rightSlot?: React.ReactNode;
};

function UnreadBadge({ children }: { children: React.ReactNode }) {
  const { unreadCount } = useNotificationCount();

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              mass: 0.5,
            }}
            className="pointer-events-none absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background"
            aria-label={`${unreadCount} ${unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DashboardHeader({
  breadcrumb,
  title,
  rightSlot,
}: DashboardHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6 max-[559px]:h-14 max-[559px]:gap-2 max-[559px]:px-3"
    >
      <div
        className="max-[559px]:shrink-0"
      >
        <SidebarTrigger />
      </div>
      <div className="h-4 w-px bg-border max-[559px]:hidden" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-muted-foreground max-[559px]:hidden">{breadcrumb}</p>
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </div>
      {rightSlot}
      <div className="max-[559px]:hidden"><GlobalSearch /></div>
      <div className="max-[559px]:hidden"><ThemeToggle /></div>
      <Button aria-label="Abrir guia do sistema" title="Guia do sistema" render={<Link href="/guia" />} size="icon" variant="ghost">
        <BookOpen aria-hidden="true" />
      </Button>
      <UnreadBadge>
        <Button aria-label="Abrir notificacoes" render={<Link href="/notificacoes" />} size="icon" variant="ghost">
          <Bell aria-hidden="true" />
        </Button>
      </UnreadBadge>
    </header>
  );
}
