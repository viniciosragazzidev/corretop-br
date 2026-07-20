import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadStatusSelector } from "@/features/leads/components/lead-status-selector";
import { LeadTimeline } from "@/features/leads/components/lead-timeline";
import { LeadTasks } from "@/features/leads/components/lead-tasks";
import { LeadChat } from "@/features/leads/components/lead-chat";
import { LEAD_STATUS_LABELS } from "@/features/leads/lead-status-constants";
import { getLeadTimeline } from "@/features/leads/queries";
import { getQuotesByLead } from "@/features/quotes/queries";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { StartServiceButton } from "./start-service-button";
import { LeadManagementActions } from "./management-actions";
import { CotarButton } from "./cotar-button";
import { QuoteBuilder } from "@/features/leads/components/quote-builder";
import { QuoteCard } from "@/features/leads/components/quote-card";

import { getRequirementsForLead, getLeadDocuments } from "@/features/documents/actions";
import { LeadDocumentsSection } from "@/features/documents/components/lead-documents-section";
import { LeadActionHub } from "@/features/leads/components/lead-action-hub";
import { LeadFeedbackForm } from "./lead-feedback-form";
import { RegisterSalePanel } from "./register-sale-panel";
import { BeneficiariesSection } from "./beneficiaries-section";
import { getLeadBeneficiaries } from "@/features/post-sale/queries";
import { Phone, Clock, Share, Buildings, UserPlus } from "@/components/huge-icons";
import { PersonRecordDetails } from "@/features/customer-record/components/person-record-details";

function getCurrentTimestamp() {
  return Date.now();
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {


  const { id } = await params;
  const context = await getRequiredTenantContext();
  const [lead] = await getDatabase()
    .select({
      id: schema.leads.id,
      nome: schema.leads.nome,
      telefone: schema.leads.telefone,
      email: schema.leads.email,
      origem: schema.leads.origem,
      status: schema.leads.status,
      corretorId: schema.leads.corretorId,
      branchId: schema.leads.branchId,
      planId: schema.leads.planId,
      motivoPerda: schema.leads.motivoPerda,
      consentimentoLgpd: schema.leads.consentimentoLgpd,
      createdAt: schema.leads.createdAt,
      stageEnteredAt: schema.leads.stageEnteredAt,
      corretorNome: schema.user.name,
      branchNome: schema.branches.name,
    })
    .from(schema.leads)
    .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
    .leftJoin(schema.branches, eq(schema.leads.branchId, schema.branches.id))
    .where(and(
      eq(schema.leads.id, id),
      eq(schema.leads.tenantId, context.tenantId),
      context.role === "broker"
        ? eq(schema.leads.corretorId, context.userId)
        : context.role === "manager" && context.branchId
          ? eq(schema.leads.branchId, context.branchId)
          : undefined,
    ))
    .limit(1);

  if (!lead) notFound();
  const slaMinutes = Number((await getDatabase().select({ minutes: schema.tenants.slaFirstContactMinutes }).from(schema.tenants).where(eq(schema.tenants.id, context.tenantId)).limit(1))[0]?.minutes ?? 15);
  const elapsedMinutes = Math.max(0, Math.round((getCurrentTimestamp() - lead.stageEnteredAt.getTime()) / 60000));
  const remainingMinutes = Math.max(0, slaMinutes - elapsedMinutes);
  const slaUrgent = remainingMinutes <= Math.max(5, Math.round(slaMinutes * 0.25));

  const [interactions, tasks, requirements, leadDocs, beneficiaries, quotes, plans] = await Promise.all([
    getLeadTimeline(id),
    getDatabase().select({ id: schema.leadTasks.id, title: schema.leadTasks.title, description: schema.leadTasks.description, priority: schema.leadTasks.priority, dueAt: schema.leadTasks.dueAt, completedAt: schema.leadTasks.completedAt, createdAt: schema.leadTasks.createdAt, assignedTo: schema.leadTasks.assignedTo, assigneeName: schema.user.name })
      .from(schema.leadTasks).leftJoin(schema.user, eq(schema.leadTasks.assignedTo, schema.user.id)).where(and(eq(schema.leadTasks.tenantId, context.tenantId), eq(schema.leadTasks.leadId, id)))
      .orderBy(schema.leadTasks.completedAt, schema.leadTasks.dueAt, schema.leadTasks.createdAt),
    getRequirementsForLead(id),
    getLeadDocuments(id),
    getLeadBeneficiaries(id),
    getQuotesByLead(id),
    getDatabase().select({ id: schema.globalPlans.id, name: schema.globalPlans.name })
      .from(schema.globalPlans)
      .where(eq(schema.globalPlans.status, "published"))
      .orderBy(schema.globalPlans.name),
  ]);

  if (!interactions) notFound();


  const brokers = (context.role === "manager" || context.role === "director") && lead.branchId
    ? await getDatabase().select({ id: schema.user.id, name: schema.user.name }).from(schema.tenantMemberships)
      .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
      .where(and(eq(schema.tenantMemberships.tenantId, context.tenantId), eq(schema.tenantMemberships.branchId, lead.branchId!), eq(schema.tenantMemberships.role, "broker"), eq(schema.tenantMemberships.status, "active"), eq(schema.user.active, true)))
    : [];

  const canSeePersonalData = context.role !== "broker" || lead.corretorId !== context.userId || lead.status !== "distributed";
  const maskedPhone = maskPhone(lead.telefone);
  const maskedEmail = lead.email ? maskEmail(lead.email) : "Não informado";

  return (
    <>
      <DashboardHeader breadcrumb="Operação comercial" title="Perfil do Lead" />
      <main className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col gap-5 bg-background p-4 lg:p-6">

        {/* Profile Cover & Header Card */}
        <div className="rounded-xl border border-border/80 bg-card px-4 py-4 shadow-none sm:px-5">
          {/* Subtle brand color cover warning */}
          <div className="hidden" />

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Avatar overlapping cover */}
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              {lead.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{lead.nome}</h1>
                  <Badge variant={lead.status === "lost" ? "destructive" : "outline"} className="capitalize">
                    {lead.status === "in_contact" ? "Em atendimento" : (LEAD_STATUS_LABELS as Record<string, string>)[lead.status] ?? lead.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>Criado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(lead.createdAt)}</span>
                  <span>•</span>
                  <span>Unidade: <strong className="font-semibold text-foreground">{lead.branchNome ?? "Geral/Sem filial"}</strong></span>
                </div>
              </div>

              {/* Quick Header Actions */}
              <div id="lead-actions" className="flex flex-wrap items-center gap-2 sm:justify-end">
                {context.role === "broker" && context.userId === lead.corretorId && lead.status === "distributed" && (
                  <StartServiceButton leadId={lead.id} />
                )}
                {lead.status !== "distributed" && (
                  <CotarButton />
                )}
                <Badge className={slaUrgent ? "border-warning/30 bg-warning/[0.08] text-warning" : "border-border/80"} variant="outline">
                  {lead.status === "distributed" ? `SLA: ${remainingMinutes > 0 ? `expira em ${remainingMinutes}min` : "expirado"}` : "SLA em acompanhamento"}
                </Badge>
                {/* Render status selector if allowed */}
                {(lead.corretorId
                  ? (context.userId === lead.corretorId && lead.status !== "distributed")
                  : (context.role !== "broker")) ? (
                  <LeadStatusSelector leadId={lead.id} currentStatus={lead.status} role={context.role} isOwner={context.userId === lead.corretorId} isSameBranch={context.branchId === lead.branchId} />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Main operational area */}
        <div className="space-y-5">
          {/* Lead Action Hub Recommendation (only for the broker owner) */}
          <LeadActionHub
            hasPendingDocuments={leadDocs.some((document) => document.status === "pending" || document.status === "rejected")}
            hasQuotes={quotes.length > 0}
            leadId={lead.id}
            currentOwner={lead.corretorNome}
            nextTask={(() => { const task = tasks.find((item) => !item.completedAt); return task ? { title: task.title, dueAt: task.dueAt?.toISOString() ?? null, priority: task.priority, assigneeName: task.assigneeName } : null; })()}
            status={lead.status}
            isOwner={context.userId === lead.corretorId}
            phone={canSeePersonalData ? lead.telefone : null}
            canSeePersonalData={canSeePersonalData}
          />

          {/* Quote Builder (only for broker owner) */}
          {context.role === "broker" && context.userId === lead.corretorId && lead.status !== "distributed" && lead.status !== "lost" && (
            <Card className="border-border bg-card shadow-sm" id="cotacao">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cotação</CardTitle>
                    <CardDescription className="text-xs">Monte propostas e compartilhe com o cliente.</CardDescription>
                  </div>
                  <QuoteBuilder
                    leadId={lead.id}
                    leadName={lead.nome}
                    leadPhone={canSeePersonalData ? lead.telefone : null}
                    beneficiaries={beneficiaries.map((b) => ({ id: b.id, name: b.name }))}
                    plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {quotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma cotação criada ainda.
                  </p>
                ) : (
                  quotes.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      leadName={lead.nome}
                      leadPhone={canSeePersonalData ? lead.telefone : null}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {context.role === "broker" && context.userId === lead.corretorId && lead.status !== "lost" && lead.status !== "converted" && (
            <LeadFeedbackForm leadId={lead.id} />
          )}

          <Tabs defaultValue="summary" className="min-h-0">
            <TabsList aria-label="Seções do detalhe do lead" className="w-full justify-start overflow-x-auto border-b border-border/40 pb-px" variant="line">
              <TabsTrigger value="summary">Resumo Comercial</TabsTrigger>
              <TabsTrigger value="history">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas ({tasks.filter(t => !t.completedAt).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-6">
              {/* Documents Checklist (Only show if not in distributed state) */}
              {lead.status !== "distributed" && (
                <Card className="border-border bg-card shadow-sm" id="documentos">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documentação do atendimento</CardTitle>
                    <CardDescription className="text-xs">Envie os arquivos por requisito e beneficiário. A aprovação é acompanhada pela fila central de Documentos.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <LeadDocumentsSection leadId={lead.id} requirements={requirements} documents={leadDocs} beneficiaries={beneficiaries.map((beneficiary) => ({ id: beneficiary.id, name: beneficiary.name, isHolder: beneficiary.isHolder }))} />
                  </CardContent>
                </Card>
              )}


            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="pt-6">
                  <LeadTimeline leadId={lead.id} interactions={interactions} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4" id="tarefas">
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="pt-6">
                  <LeadTasks assignees={context.role === "broker" ? [{ id: context.userId, name: lead.corretorNome ?? "Eu" }] : brokers} leadId={lead.id} tasks={tasks.map((task) => ({ ...task, dueAt: task.dueAt?.toISOString() ?? null, completedAt: task.completedAt?.toISOString() ?? null }))} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info & Actions Grid — contact, management, beneficiaries */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* About Contact Info Card */}
            <Card className="border-border/80 bg-card shadow-none">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold">Contato e contexto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {canSeePersonalData ? (
                        <a className="text-primary hover:underline font-semibold" href={`tel:${lead.telefone.replace(/\D/g, "")}`}>{lead.telefone}</a>
                      ) : maskedPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {canSeePersonalData && lead.email ? (
                        <a className="text-primary hover:underline font-semibold" href={`mailto:${lead.email}`}>{lead.email}</a>
                      ) : canSeePersonalData ? "Não informado" : maskedEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Share className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Origem do Lead</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{lead.origem ?? "Não informada"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Buildings className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade / Filial</p>
                    <p className="mt-0.5 text-sm font-semibold text-primary">{lead.branchNome ?? "Geral/Sem filial"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UserPlus className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Responsável</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{lead.corretorNome ?? "Aguardando distribuição"}</p>
                  </div>
                </div>

                {lead.motivoPerda && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                    <p className="font-semibold uppercase tracking-wider text-[10px]">Motivo da Perda</p>
                    <p className="mt-1 font-medium">{lead.motivoPerda}</p>
                  </div>
                )}

                {!canSeePersonalData && (
                  <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-muted-foreground leading-relaxed">
                    O telefone e o e-mail serão liberados somente quando você iniciar o atendimento. Essa ação registra sua responsabilidade pelo lead.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Management Actions + Person Details */}
            <div className="space-y-4">
              <LeadManagementActions leadId={lead.id} brokers={brokers} canManage={context.role === "manager" || context.role === "director"} isLost={lead.status === "lost"} currentStatus={lead.status} currentOwner={lead.corretorNome} />
              <PersonRecordDetails kind="lead" createdAt={lead.createdAt} consentimentoLgpd={lead.consentimentoLgpd} dependents={beneficiaries} documentCount={leadDocs.length} />
            </div>

            {/* Beneficiaries + Sale Registration */}
            <div className="space-y-4">
              <BeneficiariesSection leadId={lead.id} contactName={lead.nome} initialBeneficiaries={beneficiaries} />
              {lead.status === "under_analysis" || lead.status === "documentation_pending" ? <RegisterSalePanel leadId={lead.id} documents={leadDocs.map((document) => ({ id: document.id, filename: document.filename, status: document.status }))} /> : null}
            </div>
          </div>

          {/* Chat Connection */}
          <LeadChat phone={canSeePersonalData ? lead.telefone : null} />
        </div>

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
