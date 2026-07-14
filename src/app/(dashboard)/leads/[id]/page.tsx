import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusSelector } from "@/features/leads/components/lead-status-selector";
import { LeadTimeline } from "@/features/leads/components/lead-timeline";
import { LeadTasks } from "@/features/leads/components/lead-tasks";
import { LeadChat } from "@/features/leads/components/lead-chat";
import { LEAD_STATUS_LABELS } from "@/features/leads/lead-status-constants";
import { getLeadTimeline } from "@/features/leads/queries";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { StartServiceButton } from "./start-service-button";
import { LeadManagementActions } from "./management-actions";

import { getAllActivePlans } from "@/features/catalog/actions";
import { getLeadQuotes } from "@/features/quotes/actions";
import { LeadQuotesSection } from "@/features/quotes/components/lead-quotes-section";
import { QuoteModalButton } from "./quote-modal-button";

import { getRequirementsForLead, getLeadDocuments } from "@/features/documents/actions";
import { LeadDocumentsSection } from "@/features/documents/components/lead-documents-section";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getRequiredTenantContext();
  const [lead] = await getDatabase()
    .select({
      id: schema.leads.id,
      nome: schema.leads.nome,
      telefone: schema.leads.telefone,
      email: schema.leads.email,
      status: schema.leads.status,
      corretorId: schema.leads.corretorId,
      branchId: schema.leads.branchId,
      planId: schema.leads.planId,
      motivoPerda: schema.leads.motivoPerda,
      createdAt: schema.leads.createdAt,
      stageEnteredAt: schema.leads.stageEnteredAt,
      corretorNome: schema.user.name,
    })
    .from(schema.leads)
    .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
    .where(and(eq(schema.leads.id, id), eq(schema.leads.tenantId, context.tenantId)))
    .limit(1);

  if (!lead) notFound();
  const slaMinutes = Number((await getDatabase().select({ minutes: schema.tenants.slaFirstContactMinutes }).from(schema.tenants).where(eq(schema.tenants.id, context.tenantId)).limit(1))[0]?.minutes ?? 15);
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - lead.stageEnteredAt.getTime()) / 60000));
  const remainingMinutes = Math.max(0, slaMinutes - elapsedMinutes);
  const slaUrgent = remainingMinutes <= Math.max(5, Math.round(slaMinutes * 0.25));

  const [interactions, tasks, quotes, plans, requirements, leadDocs] = await Promise.all([
    getLeadTimeline(id),
    getDatabase().select({ id: schema.leadTasks.id, title: schema.leadTasks.title, description: schema.leadTasks.description, priority: schema.leadTasks.priority, dueAt: schema.leadTasks.dueAt, completedAt: schema.leadTasks.completedAt, createdAt: schema.leadTasks.createdAt })
      .from(schema.leadTasks).where(and(eq(schema.leadTasks.tenantId, context.tenantId), eq(schema.leadTasks.leadId, id)))
      .orderBy(schema.leadTasks.completedAt, schema.leadTasks.dueAt, schema.leadTasks.createdAt),
    getLeadQuotes(id),
    getAllActivePlans(),
    getRequirementsForLead(id),
    getLeadDocuments(id),
  ]);

  if (!interactions) notFound();
  const [whatsappConnection] = await getDatabase().select({ active: schema.whatsappConnections.chatInternoAtivo }).from(schema.whatsappConnections).where(and(eq(schema.whatsappConnections.tenantId, context.tenantId), eq(schema.whatsappConnections.userId, context.userId))).limit(1);
  const whatsappMessages = await getDatabase().select({ id: schema.whatsappMessages.id, body: schema.whatsappMessages.body, direction: schema.whatsappMessages.direction, sentAt: schema.whatsappMessages.sentAt }).from(schema.whatsappMessages).where(and(eq(schema.whatsappMessages.tenantId, context.tenantId), eq(schema.whatsappMessages.leadId, id))).orderBy(schema.whatsappMessages.sentAt);
  const brokers = (context.role === "manager" || context.role === "director") && lead.branchId
    ? await getDatabase().select({ id: schema.user.id, name: schema.user.name }).from(schema.tenantMemberships)
      .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
      .where(and(eq(schema.tenantMemberships.tenantId, context.tenantId), eq(schema.tenantMemberships.branchId, lead.branchId!), eq(schema.tenantMemberships.role, "broker"), eq(schema.tenantMemberships.status, "active"), eq(schema.user.active, true)))
    : [];
  const canSeePersonalData = context.role !== "broker" || lead.corretorId !== context.userId || lead.status !== "distributed";
  const chatCanSend = lead.corretorId === context.userId && lead.status !== "distributed";
  const chatCanAssume = (context.role === "manager" || context.role === "director") && !chatCanSend && ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(lead.status);
  const maskedPhone = maskPhone(lead.telefone);
  const maskedEmail = lead.email ? maskEmail(lead.email) : "Não informado";

  return (
    <>
      <DashboardHeader breadcrumb="Operacao comercial" title="Detalhe do lead" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <div>
          <p className="text-xs font-medium text-primary">LEAD / DETALHE</p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{lead.nome}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Criado em {new Intl.DateTimeFormat("pt-BR").format(lead.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {lead.status !== "distributed" && (
                <QuoteModalButton leadId={lead.id} plans={plans.map((p) => ({ id: p.id, name: p.name, carrierName: p.carrierName, coverage: p.type }))} />
              )}
              {context.role === "director" ? <Button render={<a href="/settings/whatsapp" />} size="sm" variant="outline">Integração WhatsApp</Button> : null}
              <Badge className={slaUrgent ? "border-amber-300/40 bg-amber-300/10 text-amber-200" : "border-border"} variant="outline">{lead.status === "distributed" ? `SLA: ${remainingMinutes > 0 ? `expira em ${remainingMinutes}min` : "expirado"}` : "SLA em acompanhamento"}</Badge>
              {context.role === "broker" && context.userId === lead.corretorId && lead.status === "distributed" ? <StartServiceButton leadId={lead.id} /> : null}
              {(lead.status !== "distributed" || context.role !== "broker") ? <LeadStatusSelector leadId={lead.id} currentStatus={lead.status} role={context.role} isOwner={context.userId === lead.corretorId} isSameBranch={context.branchId === lead.branchId} /> : null}
            </div>
          </div>
        </div>

        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)]">
          <div className="space-y-6">
            <Card className="h-fit border-border bg-card shadow-none">
              <CardHeader><CardTitle>Dados do contato</CardTitle><CardDescription>{canSeePersonalData ? "Informações liberadas para atendimento." : "Dados protegidos até o início do atendimento."}</CardDescription></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Telefone</p><p className="mt-1 text-sm font-medium">{canSeePersonalData ? <a className="text-primary hover:underline" href={`tel:${lead.telefone.replace(/\D/g, "")}`}>{lead.telefone}</a> : maskedPhone}</p></div>
                <div><p className="text-xs text-muted-foreground">E-mail</p><p className="mt-1 text-sm font-medium">{canSeePersonalData && lead.email ? <a className="text-primary hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a> : canSeePersonalData ? "Não informado" : maskedEmail}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge variant={lead.status === "lost" ? "destructive" : "outline"}>{lead.status === "in_contact" ? "Em atendimento" : LEAD_STATUS_LABELS[lead.status] ?? lead.status}</Badge>{["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(lead.status) ? <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-200" variant="outline">Ativo agora</Badge> : null}</div></div>
                <div><p className="text-xs text-muted-foreground">Responsável</p><p className="mt-1 text-sm font-medium">{lead.corretorNome ?? "Aguardando distribuição"}</p></div>
                {!canSeePersonalData ? <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-muted-foreground sm:col-span-2">O telefone e o e-mail serão liberados somente quando você iniciar o atendimento. Essa ação registra sua responsabilidade pelo lead.</div> : null}
                {lead.motivoPerda ? <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Motivo da perda</p><p className="mt-1 text-sm font-medium text-destructive">{lead.motivoPerda}</p></div> : null}
              </CardContent>
            </Card>

            {lead.status !== "distributed" && (
              <Card className="h-fit border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Documentos Obrigatórios</CardTitle>
                  <CardDescription>Upload de arquivos necessários para a contratação.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadDocumentsSection leadId={lead.id} requirements={requirements} documents={leadDocs} />
                </CardContent>
              </Card>
            )}

            {lead.status !== "distributed" && (
              <Card className="h-fit border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Propostas e Cotações</CardTitle>
                  <CardDescription>Consulte o histórico de propostas geradas para este lead.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadQuotesSection quotes={quotes.map((q) => ({ id: q.id, status: q.status, publicToken: q.publicToken, createdAt: q.createdAt, totalPrice: q.totalPrice, plansCount: q.plansCount }))} />
                </CardContent>
              </Card>
            )}
          </div>

          <LeadTimeline leadId={lead.id} interactions={interactions} />
        </section>
        <LeadTasks assignees={context.role === "broker" ? [{ id: context.userId, name: lead.corretorNome ?? "Eu" }] : brokers} leadId={lead.id} tasks={tasks.map((task) => ({ ...task, dueAt: task.dueAt?.toISOString() ?? null, completedAt: task.completedAt?.toISOString() ?? null }))} />
        <LeadChat active={whatsappConnection?.active ?? false} canAssume={chatCanAssume} canSend={chatCanSend} leadId={lead.id} messages={whatsappMessages} phone={canSeePersonalData ? lead.telefone : null} />
        <LeadManagementActions leadId={lead.id} brokers={brokers} canManage={context.role === "manager" || context.role === "director"} isLost={lead.status === "lost"} currentStatus={lead.status} currentOwner={lead.corretorNome} />
      </main>
    </>
  );
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}` : "••••";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "••••";
  return `${local.slice(0, 1)}${"•".repeat(Math.max(2, local.length - 1))}@${domain}`;
}
