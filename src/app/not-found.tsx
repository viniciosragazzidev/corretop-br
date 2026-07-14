"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { House, FileText, ArrowRight, RocketLaunch } from "@/components/huge-icons";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      {/* Background Concentric Orbits */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="absolute h-[600px] w-[600px] rounded-full border border-dashed border-muted-foreground/20 animate-[spin_120s_linear_infinite]" />
        <div className="absolute h-[450px] w-[450px] rounded-full border border-dotted border-muted-foreground/30 animate-[spin_80s_linear_infinite]" />
        <div className="absolute h-[300px] w-[300px] rounded-full border border-dashed border-muted-foreground/40 animate-[spin_40s_linear_infinite]" />
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center">
        {/* Subtitle */}
        <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Você parece um pouco perdido...
        </p>

        {/* Title */}
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
          Oops! Página não encontrada
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          O caminho que você tentou acessar não existe ou foi movido. Use os atalhos abaixo para voltar ao trabalho e continuar gerenciando seus negócios.
        </p>

        {/* Animated Rocket Flight */}
        <div className="relative my-8 flex h-52 w-52 items-center justify-center">
          {/* Glow rings */}
          <motion.div
            className="absolute h-40 w-40 rounded-full border border-primary/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.08, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute h-28 w-28 rounded-full border border-primary/15"
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.12, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Glow blur */}
          <div className="absolute h-36 w-36 rounded-full bg-primary/10 blur-2xl animate-pulse" />

          {/* Rocket icon with refined flight path */}
          <motion.div
            animate={{
              y: [0, -14, 0, -8, 0],
              x: [0, 6, 0, -6, 0],
              rotate: [0, -4, 0, 4, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.12, rotate: 12 }}
          >
            <RocketLaunch className="size-20 text-primary drop-shadow-[0_0_24px_oklch(var(--primary)/0.35)]" />
          </motion.div>
        </div>

        {/* Shortcuts */}
        <div className="w-full max-w-sm space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <House className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-sm">Página Inicial</p>
                <p className="text-xs text-muted-foreground">Voltar ao painel principal.</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/leads"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-sm">Gerenciar Leads</p>
                <p className="text-xs text-muted-foreground">Acompanhar fila de atendimento.</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
