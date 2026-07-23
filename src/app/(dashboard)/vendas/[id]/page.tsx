import { notFound } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  CurrencyCircleDollar,
  FileText,
  UserList,
  Handshake,
} from "@/components/huge-icons";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getSaleById, getCommissionSchedule } from "@/features/sales/queries";
import { SaleDetailsTabs } from "./sale-details-tabs";

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

  const paidPercentage = totalCommissions > 0 ? Math.round((paidCommissions / totalCommissions) * 100) : 0;
  const initials = sale.leadName
    ? sale.leadName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "VD";

  return (
    <>
      <DashboardHeader breadcrumb="Operação comercial / Vendas" title="Detalhes da Venda" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        {/* Hero Header Card */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 rounded-xl border border-primary/20 bg-primary/10 text-primary font-bold text-base shadow-xs">
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-heading font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Venda #{sale.id.slice(0, 8)}
                </span>
                <Badge variant={sale.status === "active" ? "success" : "outline"} className="text-xs px-2 py-0.5">
                  {sale.status === "active" ? "Ativa" : "Cancelada"}
                </Badge>
              </div>
              <h1 className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {sale.leadName}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                Registrada em {new Intl.DateTimeFormat("pt-BR").format(new Date(sale.saleDate))}
                {sale.branchName && (
                  <>
                    <span>•</span>
                    <span>{sale.branchName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
            <Button size="sm" variant="outline" render={<Link href={`/leads/${sale.leadId}`} />} className="gap-1.5 text-xs">
              <FileText className="size-3.5" /> Ver lead
            </Button>
            {sale.clientName && (
              <Button size="sm" variant="outline" render={<Link href={`/clientes`} />} className="gap-1.5 text-xs">
                <UserList className="size-3.5" /> Ver cliente
              </Button>
            )}
            <Button size="sm" variant="ghost" render={<Link href="/vendas" />} className="gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5" /> Voltar
            </Button>
          </div>
        </div>

        {/* Summary KPI Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card size="sm" className="border-border bg-card shadow-xs transition-all hover:border-primary/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Valor da Venda</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight text-foreground">
                  {formatCurrency(Number(sale.saleValue))}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="border-border bg-card shadow-xs transition-all hover:border-primary/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total em Comissões</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight text-foreground">
                  {formatCurrency(totalCommissions)}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CurrencyCircleDollar className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="border-border bg-card shadow-xs transition-all hover:border-emerald-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Comissão Paga</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(paidCommissions)}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="border-border bg-card shadow-xs transition-all hover:border-amber-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Comissão A Pagar</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {formatCurrency(pendingCommissions)}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout Completion Progress Indicator */}
        {totalCommissions > 0 && (
          <Card size="sm" className="border-border/60 bg-muted/20 shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Handshake className="size-4 text-primary" />
                  Progresso do Repasse de Comissões
                </span>
                <span className="font-mono font-semibold text-primary">{paidPercentage}% Concluído</span>
              </div>
              <Progress value={paidPercentage} className="h-2 bg-muted" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>{schedule.filter((i) => i.status === "paid").length} de {schedule.length} parcelas liberadas</span>
                <span>{schedule.filter((i) => i.status === "pending").length} parcelas restantes</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Details & Schedule Tabs */}
        <SaleDetailsTabs
          sale={{
            ...sale,
            saleValue: String(sale.saleValue),
          }}
          schedule={schedule.map((item) => ({
            ...item,
            dueDate: item.dueDate?.toISOString() ?? null,
            paidAt: item.paidAt?.toISOString() ?? null,
          }))}
          canManage={context.role === "director"}
        />
      </main>
    </>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
