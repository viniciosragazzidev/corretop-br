import { DashboardHeader} from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancialPage() {
  return (
    <>
      <DashboardHeader breadcrumb="Área financeira" title="Financeiro" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">GESTÃO FINANCEIRA</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Financeiro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe comissões, repasses, metas financeiras e resultados da corretora.
            </p>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader className="pb-1">
              <CardDescription>Comissões do período</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-muted-foreground">—</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader className="pb-1">
              <CardDescription>Repasses pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-muted-foreground">—</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader className="pb-1">
              <CardDescription>Meta do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-muted-foreground">—</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader className="pb-1">
              <CardDescription>Receita realizada</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-muted-foreground">—</p>
            </CardContent>
          </Card>
        </section>

        {/* Modules Grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Comissões</CardTitle>
              <CardDescription>
                Regras de comissão por operadora/plano, repasses e histórico de pagamentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
                <p className="text-sm font-medium">Módulo em desenvolvimento</p>
                <p className="text-xs text-muted-foreground">
                  Configure as regras de comissão e acompanhe os repasses dos corretores.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Metas Financeiras</CardTitle>
              <CardDescription>
                Metas de faturamento por corretor, filial e operadora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
                <p className="text-sm font-medium">Módulo em desenvolvimento</p>
                <p className="text-xs text-muted-foreground">
                  Defina metas de receita e acompanhe o progresso da equipe.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Exportação de relatórios de comissão, repasse e desempenho.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
                <p className="text-sm font-medium">Módulo em desenvolvimento</p>
                <p className="text-xs text-muted-foreground">
                  Gere relatórios detalhados em Excel/CSV para análise financeira.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Cronograma de Repasses</CardTitle>
              <CardDescription>
                Calendário automático de repasses e marcação manual de comissões pagas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
                <p className="text-sm font-medium">Módulo em desenvolvimento</p>
                <p className="text-xs text-muted-foreground">
                  Automatize o cronograma de pagamentos e acompanhe o que já foi repassado.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
