"use client";

import { useState, type ReactNode, type ComponentType, type SVGProps } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ChevronDownIcon } from "@/components/huge-icons";
import { SidebarGroup, SidebarGroupContent, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { weight?: string; className?: string }>;

export function SidebarCollapsibleGroup({
  label,
  icon: Icon,
  defaultOpen = true,
  children,
  className,
  headerClassName,
}: {
  label: string;
  icon?: IconComponent;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // When sidebar is collapsed (icon mode), always show items so tooltips work.
  const showContent = isOpen || isCollapsed;

  return (
    <SidebarGroup className={cn("group/collapsible", className)}>
      {/* Collapsed state: large icon + rotated label — hidden when expanded */}
      <div
        className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1.5 py-2 px-1"
        aria-hidden="true"
      >
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent/50 text-sidebar-foreground/60">
            <Icon className="size-[1.125rem] shrink-0" />
          </div>
        )}
        <span
          className="text-[9px] items-start justify-start flex-nowrap w-full text-ellipsis truncate  font-bold uppercase tracking-widest text-sidebar-foreground/40 leading-none"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}
        >
          {label}
        </span>
      </div>

      {/* Expanded state: normal collapsible header — hidden when collapsed */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear hover:text-sidebar-foreground focus-visible:ring-2 group-data-[collapsible=icon]:hidden",
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

      {/* Content: animated when expanded, always rendered when collapsed (for tooltips) */}
      {isCollapsed ? (
        <SidebarGroupContent>{children}</SidebarGroupContent>
      ) : (
        <AnimatePresence initial={false}>
          {showContent && (
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
      )}
    </SidebarGroup>
  );
}
