import { notFound } from "next/navigation";

import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getSaleById, getCommissionSchedule } from "@/features/sales/queries";
import { CommissionScheduleTable } from "./commission-schedule-table";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getRequiredTenantContext();

  const [sale, schedule] = await Promise.all([
    getSaleById(id),
    getCommissionSchedule(id),
  ]);

  if (!sale) notFound();

  const totalCommissions = schedule.reduce((sum, item) => sum + Number(item.amount), 0);
  const paidCommissions = schedule
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const pendingCommissions = schedule
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <>
      <DashboardHeader breadcrumb="Operação comercial / Vendas" title="Detalhe da venda" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">VENDAS / DETALHE</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {sale.leadName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Venda registrada em {new Intl.DateTimeFormat("pt-BR").format(new Date(sale.saleDate))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" render={<Link href={`/leads/${sale.leadId}`} />}>
              Ver lead
            </Button>
            {sale.clientName && (
              <Button size="sm" variant="outline" render={<Link href={`/clientes`} />}>
                Ver cliente
              </Button>
            )}
            <Button size="sm" variant="outline" render={<Link href="/vendas" />}>
              Voltar
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Valor da venda</p>
              <p className="mt-2 font-mono text-xl font-semibold">
                {formatCurrency(Number(sale.saleValue))}
              </p>
            </CardContent>
          </Card>
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total em comissões</p>
              <p className="mt-2 font-mono text-xl font-semibold">
                {formatCurrency(totalCommissions)}
              </p>
            </CardContent>
          </Card>
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="mt-2 font-mono text-xl font-semibold text-emerald-500">
                {formatCurrency(paidCommissions)}
              </p>
            </CardContent>
          </Card>
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">A pagar</p>
              <p className="mt-2 font-mono text-xl font-semibold text-amber-500">
                {formatCurrency(pendingCommissions)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sale details */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.7fr)]">
          <div className="space-y-6">
            {/* Commission Schedule */}
            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Cronograma de Repasse</CardTitle>
                <CardDescription>
                  Parcelas da comissão geradas automaticamente com base na regra aplicável.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <CommissionScheduleTable
                  schedule={schedule.map((item) => ({
                    ...item,
                    dueDate: item.dueDate?.toISOString() ?? null,
                    paidAt: item.paidAt?.toISOString() ?? null,
                  }))}
                  canManage={context.role === "director"}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <aside className="space-y-4">
            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Informações</CardTitle>
                <CardDescription>Dados da venda e comissionamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Lead" value={sale.leadName} />
                <InfoRow label="Cliente" value={sale.clientName ?? "—"} />
                <InfoRow label="Corretor" value={sale.brokerName ?? "—"} />
                <InfoRow label="Filial" value={sale.branchName ?? "—"} />
                <InfoRow
                  label="Plano"
                  value={sale.planName ? `${sale.planName}${sale.carrierName ? ` (${sale.carrierName})` : ""}` : "—"}
                />
                <InfoRow label="Regra de comissão" value={sale.ruleName ?? "Padrão (100% única)"} />
                <InfoRow
                  label="Status"
                  value={
                    <Badge
                      variant={sale.status === "active" ? "success" : "outline"}
                    >
                      {sale.status === "active" ? "Ativa" : "Cancelada"}
                    </Badge>
                  }
                />
                <InfoRow label="Data da venda" value={new Intl.DateTimeFormat("pt-BR").format(new Date(sale.saleDate))} />
                <InfoRow label="Valor" value={formatCurrency(Number(sale.saleValue))} />
                <InfoRow label="Total de parcelas" value={String(schedule.length)} />
                <InfoRow label="Parcelas pendentes" value={String(schedule.filter((i) => i.status === "pending").length)} />
                <InfoRow label="Parcelas pagas" value={String(schedule.filter((i) => i.status === "paid").length)} />
              </CardContent>
            </Card>

            {sale.notes && (
              <Card className="border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{sale.notes}</p>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
