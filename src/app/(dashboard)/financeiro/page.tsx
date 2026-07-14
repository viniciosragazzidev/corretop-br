"use client";

import { motion } from "motion/react";
import { DashboardHeader} from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cardGridVariants, cardItemVariants } from "@/shared/animations";

export default function FinancialPage() {
  return (
    <>
      <DashboardHeader breadcrumb="Área financeira" title="Financeiro" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
          className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
        >
          <div>
            <p className="text-xs font-medium text-primary">GESTÃO FINANCEIRA</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Financeiro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe comissões, repasses, metas financeiras e resultados da corretora.
            </p>
          </div>
        </motion.section>

        {/* Summary Cards */}
        <motion.section
          variants={cardGridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: "Comissões do período", value: "—" },
            { label: "Repasses pendentes", value: "—" },
            { label: "Meta do mês", value: "—" },
            { label: "Receita realizada", value: "—" },
          ].map((item) => (
            <motion.div key={item.label} variants={cardItemVariants}>
              <Card className="rounded-xl border-border/70 bg-card shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm">
                <CardHeader className="pb-1">
                  <CardDescription>{item.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tabular-nums text-muted-foreground">{item.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        {/* Modules Grid */}
        <motion.section
          variants={cardGridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {[
            { title: "Comissões", desc: "Regras de comissão por operadora/plano, repasses e histórico de pagamentos." },
            { title: "Metas Financeiras", desc: "Metas de faturamento por corretor, filial e operadora." },
            { title: "Relatórios Financeiros", desc: "Exportação de relatórios de comissão, repasse e desempenho." },
            { title: "Cronograma de Repasses", desc: "Calendário automático de repasses e marcação manual de comissões pagas." },
          ].map((module) => (
            <motion.div key={module.title} variants={cardItemVariants}>
              <Card className="rounded-xl border-border/70 bg-card shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm">
                <CardHeader>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
                    <p className="text-sm font-medium">Módulo em desenvolvimento</p>
                    <p className="text-xs text-muted-foreground">
                      Este módulo será implementado em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </main>
    </>
  );
}
