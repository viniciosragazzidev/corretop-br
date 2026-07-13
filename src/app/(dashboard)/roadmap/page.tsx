import {
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  Flag,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roadmapDays, roadmapItems, type RoadmapStatus } from "@/features/roadmap/roadmap-data";

const statusConfig: Record<RoadmapStatus, { label: string; icon: typeof Circle; className: string }> = {
  done: { label: "Feito", icon: CheckCircle, className: "text-emerald-500" },
  partial: { label: "Em andamento", icon: Clock, className: "text-amber-500" },
  planned: { label: "Planejado", icon: Circle, className: "text-muted-foreground" },
  external: { label: "Dependencia externa", icon: WarningCircle, className: "text-sky-500" },
};

const priorityClass = {
  P0: "border-destructive/40 text-destructive",
  P1: "border-amber-500/40 text-amber-500",
  P2: "border-muted-foreground/30 text-muted-foreground",
  "Risco externo": "border-sky-500/40 text-sky-500",
} as const;

export default function RoadmapPage() {
  const done = roadmapItems.filter((item) => item.status === "done").length;
  const partial = roadmapItems.filter((item) => item.status === "partial").length;
  const progress = Math.round(((done + partial * 0.5) / roadmapItems.length) * 100);

  return (
    <>
      <DashboardHeader breadcrumb="Planejamento" title="Roadmap de desenvolvimento" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <CalendarBlank size={15} /> Plano oficial de 7 dias
              </div>
              <CardTitle className="mt-2 text-2xl">CorreTop em construcao</CardTitle>
              <CardDescription className="max-w-2xl">Acompanhe tudo que foi definido no plano, o que ja esta funcionando e os proximos blocos para chegar ao primeiro go-live.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-2"><CardDescription>Progresso ponderado</CardDescription><CardTitle className="font-mono text-4xl">{progress}%</CardTitle></CardHeader>
            <CardContent>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{done} feitos · {partial} em andamento · {roadmapItems.length - done - partial} planejados</p>
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="mr-1 font-medium text-foreground">Legenda</span>
          {(Object.entries(statusConfig) as Array<[RoadmapStatus, (typeof statusConfig)[RoadmapStatus]]>).map(([status, config]) => {
            const Icon = config.icon;
            return <span key={status} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1"><Icon size={13} className={config.className} />{config.label}</span>;
          })}
        </div>

        <div className="space-y-6">
          {roadmapDays.map((day) => {
            const dayDone = day.items.filter((item) => item.status === "done").length;
            return (
              <section key={day.day} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Dia {day.day}</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight">{day.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{day.objective}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{dayDone}/{day.items.length} feitos</span>
                </div>
                <div className="grid gap-2">
                  {day.items.map((roadmapItem) => {
                    const config = statusConfig[roadmapItem.status];
                    const Icon = config.icon;
                    return (
                      <Card key={roadmapItem.id} size="sm" className="border-border bg-card shadow-none transition-colors hover:bg-muted/30">
                        <CardContent className="flex items-start gap-3 py-3">
                          <Icon size={20} weight={roadmapItem.status === "done" ? "fill" : "regular"} className={`mt-0.5 shrink-0 ${config.className}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{roadmapItem.id}</span>
                              <p className={`text-sm font-medium ${roadmapItem.status === "done" ? "text-foreground" : ""}`}>{roadmapItem.title}</p>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{roadmapItem.description}</p>
                            <p className="mt-1 text-[11px] leading-5 text-muted-foreground/70"><span className="font-medium text-muted-foreground">Resumo:</span> {roadmapItem.summary}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge variant="outline" className={`text-[10px] ${priorityClass[roadmapItem.priority]}`}><Flag size={11} className="mr-1" />{roadmapItem.priority}</Badge>
                            <span className={`text-[10px] ${config.className}`}>{config.label}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
