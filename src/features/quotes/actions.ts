"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

const quoteInput = z.object({
  leadId: z.string().min(1),
  planIds: z.array(z.string().min(1)).min(1, "Selecione pelo menos um plano."),
  lives: z.array(z.object({ ageBand: z.string().min(1), quantity: z.number().int().min(0) })).min(1),
  notes: z.string().trim().max(2000).optional(),
});

export type QuoteActionState = { quoteId?: string; error?: string };

export async function shareQuoteAction(quoteId: string): Promise<QuoteActionState> {
  if (!z.string().uuid().safeParse(quoteId).success) return { error: "Cotação inválida." };
  try {
    const context = await getRequiredTenantContext();
    const db = getDatabase();
    const [quote] = await db.select({ id: schema.quotes.id, leadId: schema.quotes.leadId, publicToken: schema.quotes.publicToken, corretorId: schema.leads.corretorId, branchId: schema.leads.branchId })
      .from(schema.quotes).innerJoin(schema.leads, eq(schema.quotes.leadId, schema.leads.id))
      .where(and(eq(schema.quotes.id, quoteId), eq(schema.quotes.tenantId, context.tenantId), eq(schema.leads.tenantId, context.tenantId))).limit(1);
    if (!quote) return { error: "Cotação não encontrada." };
    if (context.role === "broker" && quote.corretorId !== context.userId) return { error: "Você só pode compartilhar cotações dos seus leads." };
    if (context.role === "manager" && (!context.branchId || quote.branchId !== context.branchId)) return { error: "Esta cotação não pertence à sua filial." };
    await db.transaction(async (tx) => {
      await tx.update(schema.quotes).set({ status: "shared", sharedAt: new Date() }).where(and(eq(schema.quotes.id, quote.id), eq(schema.quotes.tenantId, context.tenantId)));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "quote", entidadeId: quote.id, acao: "compartilhou" });
    });
    revalidatePath(`/cotacoes/${quote.id}`);
    return { quoteId: quote.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível preparar o compartilhamento." };
  }
}

export async function createQuoteAction(input: z.infer<typeof quoteInput>): Promise<QuoteActionState> {
  const parsed = quoteInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getRequiredTenantContext();
    const db = getDatabase();
    const [lead] = await db.select({ id: schema.leads.id, corretorId: schema.leads.corretorId, branchId: schema.leads.branchId })
      .from(schema.leads).where(and(eq(schema.leads.id, parsed.data.leadId), eq(schema.leads.tenantId, context.tenantId))).limit(1);
    if (!lead) return { error: "Lead não encontrado." };
    if (context.role === "broker" && lead.corretorId !== context.userId) return { error: "Você só pode cotar seus próprios leads." };
    if (context.role === "manager" && lead.branchId !== context.branchId) return { error: "Este lead não pertence à sua filial." };

    const plans = await db.select({ id: schema.carrierPlans.id, name: schema.carrierPlans.name, carrierName: schema.carriers.name })
      .from(schema.carrierPlans).innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
      .where(and(eq(schema.carrierPlans.tenantId, context.tenantId), inArray(schema.carrierPlans.id, parsed.data.planIds), eq(schema.carrierPlans.active, true)));
    if (plans.length !== parsed.data.planIds.length) return { error: "Um ou mais planos não estão disponíveis." };

    const prices = await db.select({ planId: schema.carrierPlanPrices.planId, ageBand: schema.carrierPlanPrices.ageBand, monthlyPrice: schema.carrierPlanPrices.monthlyPrice })
      .from(schema.carrierPlanPrices).where(and(eq(schema.carrierPlanPrices.tenantId, context.tenantId), inArray(schema.carrierPlanPrices.planId, parsed.data.planIds)));
    const requestedBands = parsed.data.lives.filter((life) => life.quantity > 0).map((life) => life.ageBand);
    if (requestedBands.length === 0) return { error: "Informe ao menos uma vida para criar a cotação." };
    const planWithoutPrice = plans.find((plan) => requestedBands.some((ageBand) => !prices.some((price) => price.planId === plan.id && price.ageBand === ageBand)));
    if (planWithoutPrice) return { error: `O plano ${planWithoutPrice.name} não possui preços cadastrados para todas as faixas informadas.` };
    const quoteId = randomUUID();
    const publicToken = randomUUID().replaceAll("-", "");
    const totalLives = parsed.data.lives.reduce((total, life) => total + life.quantity, 0);

    await db.transaction(async (tx) => {
      await tx.insert(schema.quotes).values({ id: quoteId, tenantId: context.tenantId, leadId: lead.id, createdBy: context.userId, lives: parsed.data.lives, notes: parsed.data.notes || null, publicToken });
      await tx.insert(schema.quoteItems).values(plans.map((plan, index) => {
        const monthlyPrice = prices.filter((price) => price.planId === plan.id).reduce((total, price) => {
          const quantity = parsed.data.lives.find((life) => life.ageBand === price.ageBand)?.quantity ?? 0;
          return total + Number(price.monthlyPrice) * quantity;
        }, 0);
        return { id: randomUUID(), quoteId, planId: plan.id, monthlyPrice: monthlyPrice.toFixed(2), recommended: index === 0, snapshot: { planName: plan.name, carrierName: plan.carrierName, totalLives } };
      }));
      await tx.insert(schema.leadInteractions).values({ id: randomUUID(), leadId: lead.id, userId: context.userId, tipo: "quote_generated", conteudo: `Cotação criada com ${plans.length} plano(s) para ${totalLives} vida(s).`, metadata: { quoteId } });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "quote", entidadeId: quoteId, acao: "criou" });
    });
    revalidatePath("/cotacoes");
    revalidatePath(`/leads/${lead.id}`);
    return { quoteId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível criar a cotação." };
  }
}

export async function getLeadQuotes(leadId: string) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const rows = await db
    .select({
      id: schema.quotes.id,
      status: schema.quotes.status,
      publicToken: schema.quotes.publicToken,
      createdAt: schema.quotes.createdAt,
      totalPrice: sql<string | null>`sum(${schema.quoteItems.monthlyPrice})::text`,
      plansCount: sql<number>`count(${schema.quoteItems.id})::int`,
    })
    .from(schema.quotes)
    .leftJoin(schema.quoteItems, eq(schema.quotes.id, schema.quoteItems.quoteId))
    .innerJoin(schema.leads, eq(schema.quotes.leadId, schema.leads.id))
    .where(
      and(
        eq(schema.quotes.leadId, leadId),
        eq(schema.quotes.tenantId, context.tenantId),
        eq(schema.leads.tenantId, context.tenantId),
        context.role === "broker"
          ? eq(schema.leads.corretorId, context.userId)
          : context.role === "manager" && context.branchId
            ? eq(schema.leads.branchId, context.branchId)
            : undefined,
      )
    )
    .groupBy(schema.quotes.id)
    .orderBy(schema.quotes.createdAt);

  return rows;
}
