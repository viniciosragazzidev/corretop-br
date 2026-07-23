import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

export type EmptyStateVariant = "default" | "card" | "ghost" | "inline";

export interface EmptyStateProps {
  /** Icon component to render above the title. */
  icon?: ComponentType<{ className?: string }>;
  /** Short heading text. */
  title: string;
  /** Optional longer explanation. */
  description?: string;
  /** Optional action element (button, link, etc.). */
  action?: ReactNode;
  /** Visual variant. */
  variant?: EmptyStateVariant;
  /** Additional class names for the container. */
  className?: string;
}

/* ─── Variant styles ─── */

const variantStyles: Record<EmptyStateVariant, string> = {
  default: "rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10",
  card: "rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-14",
  ghost: "",
  inline: "flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-muted-foreground bg-muted/50",
};

/* ─── Component ─── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <p className={cn(variantStyles.inline, className)}>
        {Icon && <Icon className="size-3.5 shrink-0" />}
        <span>{title}</span>
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variantStyles[variant],
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-muted text-muted-foreground",
            variant === "ghost" ? "size-10" : "size-11",
          )}
        >
          <Icon className={variant === "ghost" ? "size-5" : "size-5"} />
        </span>
      )}
      <p className={cn("font-semibold", Icon ? "mt-3" : "")}>{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
