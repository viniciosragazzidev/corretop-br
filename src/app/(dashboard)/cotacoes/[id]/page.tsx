import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowSquareOut, ChatCircleText, FileArrowDown } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { QuoteShareActions } from "./quote-share-actions";
import { QuoteNetworkDialog } from "./quote-network-dialog";

type Lives = Array<{ ageBand: string; quantity: number }>;

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const [quote] = await db.select({ id: schema.quotes.id, leadId: schema.quotes.leadId, publicToken: schema.quotes.publicToken, lives: schema.quotes.lives, notes: schema.quotes.notes, status: schema.quotes.status, leadName: schema.leads.nome, leadPhone: schema.leads.telefone, corretorId: schema.leads.corretorId, branchId: schema.leads.branchId })
    .from(schema.quotes).innerJoin(schema.leads, eq(schema.quotes.leadId, schema.leads.id))
    .where(and(eq(schema.quotes.id, id), eq(schema.quotes.tenantId, context.tenantId), eq(schema.leads.tenantId, context.tenantId))).limit(1);
  if (!quote) notFound();
  if (context.role === "broker" && quote.corretorId !== context.userId) notFound();
  if (context.role === "manager" && (!context.branchId || quote.branchId !== context.branchId)) notFound();
  const items = await db.select({ id: schema.quoteItems.id, planId: schema.quoteItems.planId, planName: schema.carrierPlans.name, carrierName: schema.carriers.name, coverage: schema.carrierPlans.coverage, monthlyPrice: schema.quoteItems.monthlyPrice, recommended: schema.quoteItems.recommended })
    .from(schema.quoteItems).innerJoin(schema.carrierPlans, eq(schema.quoteItems.planId, schema.carrierPlans.id)).innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
    .where(eq(schema.quoteItems.quoteId, quote.id));
  const networks = items.length ? await db.select({ planId: schema.carrierPlanNetworks.planId, name: schema.carrierPlanNetworks.name, city: schema.carrierPlanNetworks.city, specialty: schema.carrierPlanNetworks.specialty }).from(schema.carrierPlanNetworks).where(and(eq(schema.carrierPlanNetworks.tenantId, context.tenantId), inArray(schema.carrierPlanNetworks.planId, items.map((item) => item.planId)))) : [];
  const quoteText = [
    `Olá, ${quote.leadName}! Preparei uma cotação para você.`,
    ...items.map((item) => `${item.recommended ? "Recomendado: " : ""}${item.planName} — ${formatCurrency(item.monthlyPrice)}/mês`),
    "Os valores dependem da análise e das condições vigentes da operadora.",
  ].join("\n");
  const lives = Array.isArray(quote.lives) ? quote.lives as Lives : [];

  return <><DashboardHeader breadcrumb="Operação comercial / Cotações" title="Revisar cotação" /><main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6"><section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-medium text-primary">COTAÇÃO</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Proposta para {quote.leadName}</h1><p className="mt-1 text-sm text-muted-foreground">Revise os planos e compartilhe uma versão consultável pelo cliente.</p></div><div className="flex gap-2"><Button render={<a href={`/api/cotacoes/${quote.id}/pdf`} />} variant="outline"><FileArrowDown /> Gerar PDF</Button><Button render={<a href={`/proposta/${quote.publicToken}`} target="_blank" />} variant="outline"><ArrowSquareOut /> Abrir link</Button></div></section><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-4"><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Planos selecionados</CardTitle><CardDescription>Valores mensais calculados pelas faixas de idade informadas.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{items.map((item) => <article className="rounded-xl border border-border p-4" key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.planName}</p><p className="mt-1 text-sm text-muted-foreground">{item.carrierName}{item.coverage ? ` · ${item.coverage}` : ""}</p></div>{item.recommended ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Recomendado</span> : null}</div><p className="mt-6 text-2xl font-semibold tracking-tight text-primary">{formatCurrency(item.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p><div className="mt-4"><QuoteNetworkDialog networks={networks.filter((network) => network.planId === item.planId)} planName={item.planName} /></div></article>)}</CardContent></Card>{quote.notes ? <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Observações</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{quote.notes}</p></CardContent></Card> : null}</div><aside className="space-y-4"><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Resumo</CardTitle><CardDescription>Informações que acompanham a proposta.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{quote.status}</span></div><div><p className="text-muted-foreground">Vidas informadas</p><div className="mt-2 flex flex-wrap gap-1.5">{lives.filter((life) => life.quantity > 0).map((life) => <span className="rounded-md bg-muted px-2 py-1 text-xs" key={life.ageBand}>{life.ageBand}: {life.quantity}</span>)}</div></div></CardContent></Card><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Compartilhar</CardTitle><CardDescription>O link é publicado apenas quando você escolhe compartilhar.</CardDescription></CardHeader><CardContent><QuoteShareActions customerName={quote.leadName} phone={quote.leadPhone} publicToken={quote.publicToken} quoteId={quote.id} quoteText={quoteText} /></CardContent></Card></aside></div></main></>;
}

function formatCurrency(value: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)); }
