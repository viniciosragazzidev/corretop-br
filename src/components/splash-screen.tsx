"use client";

import { useState, useEffect } from "react";
import { CorreTopLogo } from "@/components/corretop-logo";

/**
 * PWA splash screen.
 *
 * - Server-rendered invisible by default (opacity‑0) to avoid flashes.
 * - On mount the logo fades in (700 ms), holds briefly (300 ms),
 *   then the entire overlay fades out (500 ms) and unmounts.
 * - Respects reduced‑motion: skips all animations and hides instantly.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>("idle");
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    if (mq.matches) {
      setPhase("hidden");
      return;
    }

    // 1. Start logo fade-in on next frame
    const logoIn = requestAnimationFrame(() => setPhase("logo_enter"));

    // 2. After logo is fully in, hold a moment
    const splashOut = setTimeout(() => setPhase("splash_exit"), 700 + 300);

    // 3. After splash fade-out, remove from DOM
    const remove = setTimeout(() => setPhase("hidden"), 700 + 300 + 500);

    return () => {
      cancelAnimationFrame(logoIn);
      clearTimeout(splashOut);
      clearTimeout(remove);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--surface-base,#f8f8f7)] transition-opacity duration-500 ease-[var(--ease-smooth-out,cubic-bezier(0.22,1,0.36,1))]"
      style={{
        opacity: phase === "splash_exit" ? 0 : 1,
        willChange: "opacity",
      }}
    >
      {/* Inline transition beats CorreTopLogo's own transition-[filter] class */}
      <CorreTopLogo
        className="h-12 w-48 object-contain"
        style={{
          opacity: phase === "idle" ? 0 : 1,
          transform: phase === "idle" ? "scale(0.92) translateY(4px)" : "scale(1) translateY(0)",
          transition: "opacity 700ms var(--ease-smooth-out), transform 700ms var(--ease-smooth-out)",
          willChange: "opacity, transform",
        }}
      />
    </div>
  );
}

type SplashPhase = "idle" | "logo_enter" | "splash_exit" | "hidden";
