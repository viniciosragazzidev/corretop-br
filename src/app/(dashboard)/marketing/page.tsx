import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketingOverview } from "@/features/marketing/overview";
import { MetaTestLeadCard } from "@/features/marketing/components/meta-test-lead-card";

export default async function MarketingPage() {
  let overview;
  try { overview = await getMarketingOverview(); } catch { redirect("/access-denied"); }
  const connection = overview.connections.find((item) => item.status === "active") ?? overview.connections[0];
  return <><DashboardHeader breadcrumb="Gestão / Marketing" title="Marketing" /><main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
    <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Visão da matriz</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Captação e performance</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe as fontes conectadas e a chegada dos leads antes da distribuição para as unidades.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Leads recebidos", overview.totals.all], ["Em atendimento", overview.totals.open], ["Convertidos", overview.totals.converted], ["Perdidos", overview.totals.lost]].map(([label, value]) => <Card key={label as string}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader></Card>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card><CardHeader><CardTitle>Leads por fonte</CardTitle><CardDescription>Contagem consolidada no tenant, sem expor dados pessoais.</CardDescription></CardHeader><CardContent>{overview.sources.length ? <div className="grid gap-3">{overview.sources.map((source) => <div key={source.channel} className="flex items-center justify-between rounded-lg border p-3"><span className="font-medium">{source.channel}</span><Badge variant="secondary">{source.total}</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhum lead recebido ainda.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Conexões Meta</CardTitle><CardDescription>Status do recebimento em tempo real.</CardDescription></CardHeader><CardContent className="grid gap-3">{overview.connections.length ? overview.connections.map((item) => <div key={item.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.name}</span><Badge variant={item.status === "active" ? "success" : item.status === "error" ? "destructive" : "outline"}>{item.status}</Badge></div>{item.lastError ? <p className="mt-2 text-xs text-destructive">{item.lastError}</p> : <p className="mt-2 text-xs text-muted-foreground">Último webhook: {item.lastWebhookAt ? item.lastWebhookAt.toLocaleString("pt-BR") : "ainda não recebido"}</p>}</div>) : <p className="text-sm text-muted-foreground">Conecte uma Página em Configurações → Integrações.</p>}</CardContent></Card>
    </div>
    {connection ? <MetaTestLeadCard connectionId={connection.id} defaultFormId={connection.externalFormId} /> : null}
  </main></>;
}
