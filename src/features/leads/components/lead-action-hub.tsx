import Link from "next/link";

import { ArrowRight, ArrowSquareOut, Calculator, ChatCircleText, CheckCircle, Clock, FileText, ListChecks } from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NextTask = {
  title: string;
  dueAt: string | null;
  priority: "low" | "normal" | "urgent";
  assigneeName: string | null;
};

type LeadActionHubProps = {
  leadId: string;
  status: string;
  currentOwner: string | null;
  hasQuotes: boolean;
  hasPendingDocuments: boolean;
  nextTask: NextTask | null;
};

type Action = { href: string; label: string; icon: typeof FileText };

function getCurrentTimestamp() {
  return Date.now();
}

function getFallbackAction({ leadId, status, hasQuotes, hasPendingDocuments }: Pick<LeadActionHubProps, "leadId" | "status" | "hasQuotes" | "hasPendingDocuments">): Action {
  if (hasPendingDocuments) return { href: "#documentos", label: "Revisar documentos", icon: FileText };
  if (status === "distributed" || status === "new") return { href: "#lead-actions", label: "Ver ação do atendimento", icon: ChatCircleText };
  if (status === "quote_sent" && hasQuotes) return { href: `/cotacoes?leadId=${leadId}`, label: "Revisar cotação", icon: Calculator };
  if (status === "converted") return { href: "/clientes", label: "Acompanhar cliente", icon: CheckCircle };
  return { href: `/conversas?leadId=${leadId}`, label: "Abrir conversa", icon: ChatCircleText };
}

function formatDueAt(value: string | null) {
  if (!value) return "Sem prazo definido";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Prazo inválido";
  const overdue = date.getTime() < Date.now();
  const formatted = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  return overdue ? `Vencida em ${formatted}` : `Até ${formatted}`;
}

export function LeadActionHub({ leadId, status, currentOwner, hasQuotes, hasPendingDocuments, nextTask }: LeadActionHubProps) {
  const fallbackAction = getFallbackAction({ leadId, status, hasQuotes, hasPendingDocuments });
  const primaryAction: Action = nextTask
    ? { href: `/tarefas?leadId=${leadId}`, label: "Abrir tarefa", icon: ListChecks }
    : fallbackAction;
  const Icon = primaryAction.icon;
  const isOverdue = Boolean(nextTask?.dueAt && new Date(nextTask.dueAt).getTime() < getCurrentTimestamp());

  return (
    <section aria-labelledby="lead-next-action-title" className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Próxima ação</p>
          <h2 id="lead-next-action-title" className="mt-1 text-base font-semibold tracking-tight">{nextTask ? nextTask.title : fallbackAction.label}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{nextTask ? "Este é o próximo passo pendente para manter o atendimento em movimento." : "A recomendação considera o status atual e as pendências deste lead."}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={isOverdue ? "destructive" : "outline"}><Clock className="mr-1 size-3" />{nextTask ? formatDueAt(nextTask.dueAt) : "Sem tarefa pendente"}</Badge>
            <span>Responsável: <strong className="font-medium text-foreground">{nextTask?.assigneeName ?? currentOwner ?? "A definir"}</strong></span>
            {nextTask ? <span>Prioridade: <strong className="font-medium text-foreground">{nextTask.priority === "urgent" ? "Urgente" : nextTask.priority === "low" ? "Baixa" : "Normal"}</strong></span> : null}
          </div>
        </div>
        <Button render={<Link href={primaryAction.href} />} size="sm"><Icon />{primaryAction.label}<ArrowRight /></Button>
      </div>

      <nav aria-label="Atalhos do lead" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Button className="justify-start" render={<Link href={`/conversas?leadId=${leadId}`} />} size="sm" variant="outline"><ChatCircleText /> Conversa</Button>
        <Button className="justify-start" render={<Link href={`/tarefas?leadId=${leadId}`} />} size="sm" variant="outline"><ListChecks /> Tarefas</Button>
        <Button className="justify-start" render={<Link href={`/cotacoes?leadId=${leadId}`} />} size="sm" variant="outline"><Calculator /> Nova cotação</Button>
        <Button className="justify-start" render={<Link href="#documentos" />} size="sm" variant="outline"><FileText /> Documentos{hasPendingDocuments ? " · pendentes" : ""}</Button>
      </nav>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ArrowSquareOut className="size-3.5" /> As telas mantêm o escopo de acesso do seu cargo e da filial ativa.</p>
    </section>
  );
}
