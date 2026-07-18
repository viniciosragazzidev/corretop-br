import Link from "next/link";

import { ArrowRight, ArrowSquareOut, Calculator, ChatCircleText, CheckCircle, Clock, FileText, ListChecks, Phone, WhatsappLogo } from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadReminder } from "@/features/leads/components/lead-reminder";
import { LeadQuickNote } from "@/features/leads/components/lead-quick-note";

type NextTask = { title: string; dueAt: string | null; priority: "low" | "normal" | "urgent"; assigneeName: string | null };
type LeadActionHubProps = { leadId: string; status: string; currentOwner: string | null; hasQuotes: boolean; hasPendingDocuments: boolean; nextTask: NextTask | null; isOwner: boolean; phone: string | null; canSeePersonalData: boolean };
type Action = { href: string; label: string; icon: typeof FileText };

function getCurrentTimestamp() { return Date.now(); }
function getFallbackAction({ leadId, status, hasQuotes, hasPendingDocuments }: Pick<LeadActionHubProps, "leadId" | "status" | "hasQuotes" | "hasPendingDocuments">): Action {
  if (hasPendingDocuments) return { href: "#documentos", label: "Revisar documentos", icon: FileText };
  if (status === "distributed" || status === "new") return { href: "#lead-actions", label: "Ver ação do atendimento", icon: ChatCircleText };
  if (status === "quote_sent" && hasQuotes) return { href: "https://cotadorsimplificado.com.br/", label: "Cotar no parceiro", icon: Calculator };
  if (status === "converted") return { href: "/clientes", label: "Acompanhar cliente", icon: CheckCircle };
  return { href: "/conversas?leadId=" + leadId, label: "Abrir conversa", icon: ChatCircleText };
}
function formatDueAt(value: string | null) {
  if (!value) return "Sem prazo definido";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Prazo inválido";
  const formatted = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  return date.getTime() < Date.now() ? "Vencida em " + formatted : "Até " + formatted;
}

export function LeadActionHub({ leadId, status, currentOwner, hasQuotes, hasPendingDocuments, nextTask, isOwner, phone, canSeePersonalData }: LeadActionHubProps) {
  if (!isOwner) return null;

  const fallbackAction = getFallbackAction({ leadId, status, hasQuotes, hasPendingDocuments });
  const primaryAction: Action = nextTask ? { href: "/tarefas?leadId=" + leadId, label: "Abrir tarefa", icon: ListChecks } : fallbackAction;
  const Icon = primaryAction.icon;
  const isOverdue = Boolean(nextTask?.dueAt && new Date(nextTask.dueAt).getTime() < getCurrentTimestamp());
  return <section aria-labelledby="lead-next-action-title" className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Próxima ação</p><h2 id="lead-next-action-title" className="mt-1 max-w-2xl text-base font-semibold tracking-tight">{nextTask ? nextTask.title : fallbackAction.label}</h2><p className="mt-1 max-w-xl text-sm leading-5 text-muted-foreground">{nextTask ? "O próximo passo pendente para manter o atendimento em movimento." : "Recomendação baseada no status e nas pendências deste lead."}</p></div><Button className="w-full shrink-0 whitespace-nowrap sm:w-auto" render={<Link href={primaryAction.href} />} size="sm"><Icon />{primaryAction.label}<ArrowRight /></Button></div>
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primary/10 pt-3 text-xs text-muted-foreground"><Badge variant={isOverdue ? "destructive" : "outline"}><Clock className="mr-1 size-3" />{nextTask ? formatDueAt(nextTask.dueAt) : "Sem tarefa pendente"}</Badge><span>Responsável: <strong className="font-medium text-foreground">{nextTask?.assigneeName ?? currentOwner ?? "A definir"}</strong></span>{nextTask ? <span>Prioridade: <strong className="font-medium text-foreground">{nextTask.priority === "urgent" ? "Urgente" : nextTask.priority === "low" ? "Baixa" : "Normal"}</strong></span> : null}</div>
    <nav aria-label="Atalhos do lead" className="mt-3 flex flex-wrap gap-2">
      {canSeePersonalData && phone ? <Button className="h-8 px-2.5 text-xs" render={<a href={`tel:${phone.replace(/\D/g, "")}`} />} size="sm" variant="outline"><Phone /> Ligar</Button> : null}
      {canSeePersonalData && phone ? <Button className="h-8 px-2.5 text-xs" render={<a href={`https://wa.me/${phone.replace(/\D/g, "")}`} rel="noreferrer" target="_blank" />} size="sm" variant="outline"><WhatsappLogo /> WhatsApp</Button> : null}
      <Button className="h-8 px-2.5 text-xs" render={<Link href={"/conversas?leadId=" + leadId} />} size="sm" variant="outline"><ChatCircleText /> Conversar</Button>
      <LeadQuickNote leadId={leadId} />
      <Button className="h-8 px-2.5 text-xs" render={<Link href={"/tarefas?leadId=" + leadId} />} size="sm" variant="outline"><ListChecks /> Tarefas</Button>
      <LeadReminder leadId={leadId} />
      <Button className="h-8 px-2.5 text-xs" render={<a href="https://cotadorsimplificado.com.br/" rel="noreferrer" target="_blank" />} size="sm" variant="outline"><Calculator /> Cotação</Button>
      <Button className="h-8 px-2.5 text-xs" render={<Link href="#documentos" />} size="sm" variant="outline"><FileText /> Documentos{hasPendingDocuments ? " · pendentes" : ""}</Button>
    </nav>
    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ArrowSquareOut className="size-3.5" /> Ações respeitam o cargo e a filial ativa.</p>
  </section>;
}
