"use client";

import { Bell, BookOpen } from "@/components/huge-icons";
import Link from "next/link";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";

type DashboardHeaderProps = {
  breadcrumb: string;
  title: string;
  rightSlot?: React.ReactNode;
};

export function DashboardHeader({
  breadcrumb,
  title,
  rightSlot,
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
      className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6 max-[559px]:h-14 max-[559px]:gap-2 max-[559px]:px-3"
    >
      <motion.div
        className="max-[559px]:shrink-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.12, delay: 0.06, ease: [0, 0, 0.2, 1] }}
      >
        <SidebarTrigger />
      </motion.div>
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
      <Button aria-label="Abrir notificacoes" render={<Link href="/notificacoes" />} size="icon" variant="ghost">
        <Bell aria-hidden="true" />
      </Button>
    </motion.header>
  );
}
