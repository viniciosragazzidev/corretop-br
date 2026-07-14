"use client";

import { MoonStars, SunDim } from "@/components/huge-icons";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = isClient && theme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={isDark}
      className={cn(
        "relative overflow-hidden border-border/80 bg-background text-foreground shadow-none transition-colors hover:bg-muted",
        className,
      )}
      onClick={toggle}
      size="icon-sm"
      variant="outline"
      type="button"
    >
      <SunDim
        className={cn(
          "absolute size-4 transition-all duration-200",
          isDark
            ? "scale-75 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
      />
      <MoonStars
        className={cn(
          "absolute size-4 transition-all duration-200",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-75 -rotate-90 opacity-0",
        )}
      />
      <span className="sr-only">{isDark ? "Tema escuro" : "Tema claro"}</span>
    </Button>
  );
}
