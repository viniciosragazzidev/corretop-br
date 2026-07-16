import { ChartLineUp, CheckIcon, TrendDown, Users, XCircle } from "@/components/huge-icons";

import { Card, CardContent } from "@/components/ui/card";
import type { BranchMetrics } from "@/features/branches/queries";

type UnitMetricsCardsProps = {
  metrics: BranchMetrics;
};

type MetricCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  valueClassName?: string;
};

function MetricCard({ label, value, sub, icon, valueClassName }: MetricCardProps) {
  return (
    <Card size="sm" className="border-border bg-card shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <span className="text-muted-foreground/60">{icon}</span>
        </div>
        <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${valueClassName ?? ""}`}>
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function UnitMetricsCards({ metrics }: UnitMetricsCardsProps) {
  const conversionLabel =
    metrics.totalLeads === 0
      ? "Sem leads no período"
      : `${metrics.leadsConvertidos} de ${metrics.totalLeads} leads`;

  const lossLabel =
    metrics.totalLeads === 0
      ? "Sem leads no período"
      : `${metrics.leadsPerdidos} perdido${metrics.leadsPerdidos !== 1 ? "s" : ""} no período`;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Leads no período"
        value={metrics.totalLeads}
        sub={`Mês: ${metrics.period}`}
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
      />
      <MetricCard
        label="Taxa de conversão"
        value={`${metrics.taxaConversao}%`}
        sub={conversionLabel}
        icon={<CheckIcon className="h-4 w-4" aria-hidden="true" />}
        valueClassName={
          metrics.taxaConversao >= 30
            ? "text-emerald-500"
            : metrics.taxaConversao >= 15
              ? "text-amber-500"
              : "text-foreground"
        }
      />
      <MetricCard
        label="Em atendimento"
        value={metrics.leadsAtivos}
        sub="Leads em andamento"
        icon={<ChartLineUp className="h-4 w-4" aria-hidden="true" />}
      />
      <MetricCard
        label="Aguardando contato"
        value={metrics.leadsDistribuidos}
        sub={lossLabel}
        icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
        valueClassName={metrics.leadsDistribuidos > 0 ? "text-amber-500" : ""}
      />
    </div>
  );
}
