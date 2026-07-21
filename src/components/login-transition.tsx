"use client";

import { useState, useEffect } from "react";
import { CorreTopLogo } from "@/components/corretop-logo";

type Phase = "idle" | "logo_in" | "logo_pulse" | "page_rise" | "done";

interface LoginTransitionProps {
  active: boolean;
  onComplete: () => void;
}

export function LoginTransition({ active, onComplete }: LoginTransitionProps) {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      onComplete();
      return;
    }

    setPhase("logo_in");

    const t1 = setTimeout(() => setPhase("logo_pulse"), 600);
    const t2 = setTimeout(() => setPhase("page_rise"), 1800);
    const t3 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, onComplete]);

  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950"
      style={{
        animation: phase === "page_rise" ? "loginOverlayFade 0.8s ease-in-out forwards" : undefined,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center"
        style={{
          opacity: phase === "logo_in" || phase === "logo_pulse" ? 1 : 0,
          transform:
            phase === "logo_in"
              ? "scale(0.85) translateY(12px)"
              : phase === "logo_pulse"
                ? "scale(1) translateY(0)"
                : "scale(1.05) translateY(-8px)",
          transition:
            "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)",
          willChange: "opacity, transform",
        }}
      >
        <CorreTopLogo className="h-14 w-52 object-contain" />
      </div>

      {/* Pulsing ring behind logo */}
      <div
        className="absolute rounded-full border-2 border-primary/30"
        style={{
          width: 120,
          height: 120,
          opacity: phase === "logo_pulse" ? 1 : 0,
          transform: phase === "logo_pulse" ? "scale(1.6)" : "scale(0.8)",
          transition: "opacity 0.4s ease, transform 1s cubic-bezier(0.22,1,0.36,1)",
          animation: phase === "logo_pulse" ? "loginPulseRing 1.2s ease-in-out infinite" : undefined,
          willChange: "opacity, transform",
        }}
      />

      {/* Page rising from bottom */}
      <div
        className="absolute inset-0 bg-white dark:bg-zinc-900"
        style={{
          transform: phase === "page_rise" ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform",
        }}
      />

      <style>{`
        @keyframes loginPulseRing {
          0%, 100% {
            transform: scale(1.4);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.8);
            opacity: 0.2;
          }
        }
        @keyframes loginOverlayFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            pointer-events: none;
          }
        }
      `}</style>
    </div>
  );
}
