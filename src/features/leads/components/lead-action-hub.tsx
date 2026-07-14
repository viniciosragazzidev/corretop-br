import Link from "next/link";

import { ArrowSquareOut, Calculator, ChatCircleText, FileText, ListChecks } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";

type LeadActionHubProps = {
  leadId: string;
  hasQuotes: boolean;
  hasPendingDocuments: boolean;
  pendingTasks: number;
};

export function LeadActionHub({ leadId, hasQuotes, hasPendingDocuments, pendingTasks }: LeadActionHubProps) {
  const primaryAction = hasPendingDocuments
    ? { href: "#documentos", label: "Revisar documentos", icon: FileText }
    : pendingTasks > 0
      ? { href: `/tarefas?leadId=${leadId}`, label: "Ver próximo passo", icon: ListChecks }
      : { href: `/conversas?leadId=${leadId}`, label: "Abrir conversa", icon: ChatCircleText };

  return (
    <section aria-labelledby="lead-next-action-title" className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Próxima ação</p>
          <h2 id="lead-next-action-title" className="mt-1 text-base font-semibold tracking-tight">Mantenha este atendimento em movimento</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Use os atalhos para voltar ao contexto certo sem perder o lead, o histórico ou as pendências.</p>
        </div>
        <PrimaryActionButton action={primaryAction} />
      </div>

      <nav aria-label="Atalhos do lead" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Button className="justify-start" render={<Link href={`/conversas?leadId=${leadId}`} />} size="sm" variant="outline"><ChatCircleText /> Conversa</Button>
        <Button className="justify-start" render={<Link href={`/tarefas?leadId=${leadId}`} />} size="sm" variant="outline"><ListChecks /> Tarefas{pendingTasks > 0 ? ` (${pendingTasks})` : ""}</Button>
        <Button className="justify-start" render={<Link href={`/cotacoes?leadId=${leadId}`} />} size="sm" variant="outline"><Calculator /> Nova cotação</Button>
        <Button className="justify-start" render={<Link href="#documentos" />} size="sm" variant="outline"><FileText /> Documentos{hasPendingDocuments ? " · pendentes" : hasQuotes ? "" : " · acompanhar"}</Button>
      </nav>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ArrowSquareOut className="size-3.5" /> As telas mantêm o escopo de acesso do seu cargo e da filial ativa.</p>
    </section>
  );
}

function PrimaryActionButton({ action }: { action: { href: string; label: string; icon: typeof FileText } }) {
  const Icon = action.icon;
  return <Button render={<Link href={action.href} />} size="sm"><Icon />{action.label}</Button>;
}
