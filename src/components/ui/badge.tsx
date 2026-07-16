"use client"

import { useRender } from "@base-ui/react/use-render"
import { mergeProps } from "@base-ui/react/merge-props"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-150 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        success:
          "border-success/15 bg-success/10 text-success [a]:hover:bg-success/15",
        warning:
          "border-warning/15 bg-accent/10 text-warning [a]:hover:bg-accent/15",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        info:
          "border-blue-500/15 bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20",
        indigo:
          "border-indigo-500/15 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20",
        purple:
          "border-purple-500/15 bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20",
        pink:
          "border-pink-500/15 bg-pink-500/10 text-pink-600 dark:text-pink-400 dark:bg-pink-500/20",
        cyan:
          "border-cyan-500/15 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 dark:bg-cyan-500/20",
        orange:
          "border-orange-500/15 bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
