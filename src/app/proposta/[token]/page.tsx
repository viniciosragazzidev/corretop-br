import { and, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabase, schema } from "@/shared/db";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDatabase();
  const [quote] = await db.select({ id: schema.quotes.id, leadName: schema.leads.nome, notes: schema.quotes.notes })
    .from(schema.quotes).innerJoin(schema.leads, eq(schema.quotes.leadId, schema.leads.id))
    .where(and(eq(schema.quotes.publicToken, token), inArray(schema.quotes.status, ["shared", "sent"]))).limit(1);
  if (!quote) notFound();

  const rawItems = await db.select({ id: schema.quoteItems.id, planId: schema.quoteItems.planId, monthlyPrice: schema.quoteItems.monthlyPrice, recommended: schema.quoteItems.recommended, snapshot: schema.quoteItems.snapshot })
    .from(schema.quoteItems).where(eq(schema.quoteItems.quoteId, quote.id));

  const planIds = rawItems.map((item) => item.planId);
  const [legacyPlanDetails, globalPlanDetails] = await Promise.all([
    planIds.length > 0
      ? db.select({ id: schema.carrierPlans.id, planName: schema.carrierPlans.name, carrierName: schema.carriers.name, coverage: schema.carrierPlans.coverage })
          .from(schema.carrierPlans).innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
          .where(inArray(schema.carrierPlans.id, planIds))
      : Promise.resolve([]),
    planIds.length > 0
      ? db.select({ id: schema.globalPlans.id, planName: schema.globalPlans.name, carrierName: schema.globalCarriers.name, coverage: schema.globalPlans.coverage })
          .from(schema.globalPlans).innerJoin(schema.globalCarriers, eq(schema.globalPlans.carrierId, schema.globalCarriers.id))
          .where(inArray(schema.globalPlans.id, planIds))
      : Promise.resolve([]),
  ]);

  const planDetailMap = new Map<string, { planName: string; carrierName: string; coverage: string | null }>();
  for (const p of legacyPlanDetails) planDetailMap.set(p.id, p);
  for (const p of globalPlanDetails) planDetailMap.set(p.id, p);

  const items = rawItems.map((item) => {
    const details = planDetailMap.get(item.planId);
    const snapshot = item.snapshot as Record<string, unknown> | null;
    return {
      id: item.id,
      planName: details?.planName ?? (snapshot?.planName as string) ?? "Plano",
      carrierName: details?.carrierName ?? (snapshot?.carrierName as string) ?? "Operadora",
      coverage: details?.coverage ?? null,
      monthlyPrice: item.monthlyPrice,
      recommended: item.recommended,
    };
  });

  return <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6"><div className="mx-auto max-w-5xl"><header className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm"><CorreTopLogo className="h-8 w-32 object-contain object-left" /><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sua cotação de plano de saúde</h1><p className="mt-2 text-muted-foreground">Olá, {quote.leadName}. Compare as opções preparadas pelo seu corretor.</p></header><section className="grid gap-4 md:grid-cols-2">{items.map((item) => <Card className={item.recommended ? "border-primary/40 shadow-sm" : "shadow-sm"} key={item.id}><CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{item.carrierName}</p><CardTitle className="mt-1">{item.planName}</CardTitle></div>{item.recommended ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Recomendado</span> : null}</div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.coverage ?? "Cobertura conforme condições da operadora"}</p><p className="mt-6 text-3xl font-semibold text-primary">{formatCurrency(item.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p></CardContent></Card>)}</section>{quote.notes ? <Card className="mt-6 shadow-sm"><CardHeader><CardTitle>Observações do corretor</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{quote.notes}</CardContent></Card> : null}<p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">Valores e condições são referenciais e podem variar conforme análise, contratação e regras das operadoras.</p></div></main>;
}

function formatCurrency(value: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)); }
import { CorreTopLogo } from "@/components/corretop-logo";
