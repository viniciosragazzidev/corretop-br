"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ChevronDownIcon } from "@/components/huge-icons";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarCollapsibleGroup({
  label,
  defaultOpen = true,
  children,
  className,
  headerClassName,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <SidebarGroup className={cn("group/collapsible", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear hover:text-sidebar-foreground focus-visible:ring-2 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          headerClassName,
        )}
      >
        <ChevronDownIcon
          className={cn(
            "size-3 shrink-0 transition-transform duration-200 ease-linear",
            isOpen ? "rotate-0" : "-rotate-90",
          )}
        />
        <span>{label}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <SidebarGroupContent>{children}</SidebarGroupContent>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarGroup>
  );
}
