"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { ContextNote } from "@/components/ui/context-note";
import { Textarea } from "@/components/ui/textarea";
import { getLeadMessagesAction, sendLeadMessageAction } from "@/features/leads/actions/send-lead-message";
import { LEAD_STATUS_LABELS } from "@/features/leads/lead-status-constants";
import {
  ArrowSquareOut,
  Calculator,
  ChatCircleText,
  ChevronRightIcon,
  FileText,
  ListChecks,
  LinkSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  PanelLeftIcon,
  Phone,
  Plus,
  UserList,
  WhatsappLogo,
} from "@/components/huge-icons";
import { cn } from "@/lib/utils";
import { SetupTutorialDrawer } from "@/components/setup/setup-tutorial-drawer";
import { OwnershipContext } from "@/components/ownership-context";

export type ConversationMessage = { id: string; leadId: string | null; body: string; direction: string; sentAt: string };
export type ConversationItem = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  status: string;
  origem: string;
  branchId: string | null;
  corretorId: string | null;
  corretorNome: string | null;
  branchName: string | null;
  consentimentoLgpd: boolean;
  createdAt: string;
  stageEnteredAt: string;
  planName: string | null;
  carrierName: string | null;
  latestMessage: Pick<ConversationMessage, "body" | "direction" | "sentAt"> | null;
  messages: ConversationMessage[];
  documents: { id: string; filename: string; fileUrl: string; status: string; requirementName: string | null; createdAt: string }[];
};
export type PlanSuggestion = { id: string; name: string; carrierName: string };

type ViewFilter = "all" | "with_messages" | "without_messages";

export function ConversationsWorkspace({
  role,
  branches,
  conversations: initialConversations,
  initialLeadId,
  plans,
  whatsappReady,
  whatsappSessionReady,
  setupOpen,
  canSend,
}: {
  role: string;
  branches: { id: string; name: string }[];
  conversations: ConversationItem[];
  initialLeadId?: string;
  plans: PlanSuggestion[];
  whatsappReady: boolean;
  whatsappSessionReady: boolean;
  setupOpen?: boolean;
  canSend: boolean;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(initialLeadId && initialConversations.some((item) => item.id === initialLeadId)
    ? initialLeadId
    : initialConversations.find((item) => item.messages.length > 0)?.id ?? initialConversations[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [draft, setDraft] = useState("");
  const [plansOpen, setPlansOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [pending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages?.length]);
  const branchCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set("all", conversations.length);
    for (const branch of branches) {
      counts.set(branch.id, conversations.filter((c) => c.branchId === branch.id).length);
    }
    return counts;
  }, [conversations, branches]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return conversations.filter((conversation) => {
      const matchesQuery = !normalized || [conversation.nome, conversation.telefone, conversation.email ?? ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized));
      const matchesFilter = filter === "all" || (filter === "with_messages" ? conversation.messages.length > 0 : conversation.messages.length === 0);
      const matchesBranch = branchFilter === "all" || conversation.branchId === branchFilter;
      return matchesQuery && matchesFilter && matchesBranch;
    });
  }, [conversations, filter, branchFilter, query]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const refresh = async () => {
      const result = await getLeadMessagesAction(selectedId);
      if (!active || !result.success) return;
      setConversations((current) => current.map((conversation) => conversation.id === selectedId ? {
        ...conversation,
        messages: result.messages.map((message) => ({ ...message, leadId: selectedId, sentAt: message.sentAt.toISOString() })),
        latestMessage: result.messages.at(-1) ? { body: result.messages.at(-1)!.body, direction: result.messages.at(-1)!.direction, sentAt: result.messages.at(-1)!.sentAt.toISOString() } : null,
      } : conversation));
    };
    void refresh();
    const interval = window.setInterval(refresh, 8_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedId]);

  async function selectConversation(id: string) {
    setSelectedId(id);
    setDraft("");
    setPlansOpen(false);
    setLoadingThread(true);
    try {
      const result = await getLeadMessagesAction(id);
      if (!result.success) throw new Error(result.error);
      setConversations((current) => current.map((conversation) => conversation.id === id ? {
        ...conversation,
        messages: result.messages.map((message) => ({ ...message, leadId: id, sentAt: message.sentAt.toISOString() })),
        latestMessage: result.messages.at(-1) ? { body: result.messages.at(-1)!.body, direction: result.messages.at(-1)!.direction, sentAt: result.messages.at(-1)!.sentAt.toISOString() } : null,
      } : conversation));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir esta conversa.");
    } finally {
      setLoadingThread(false);
    }
  }

  function insertTemplate(template: string) {
    setDraft(template);
    toast.message("Texto preparado. Revise antes de enviar.");
  }

  const togglePlans = () => {
    setPlansOpen((open) => !open);
  }

  function sendMessage() {
    if (!selected || !draft.trim() || pending) return;
    startTransition(async () => {
      const result = await sendLeadMessageAction(selected.id, draft);
      if (!result.success || !result.message) {
        toast.error(result.error ?? "Não foi possível enviar a mensagem.");
        return;
      }
      const message: ConversationMessage = { ...result.message, leadId: selected.id, sentAt: result.message.sentAt.toISOString() };
      setConversations((current) => current.map((conversation) => conversation.id === selected.id ? { ...conversation, messages: [...conversation.messages, message], latestMessage: { body: message.body, direction: message.direction, sentAt: message.sentAt } } : conversation));
      setDraft("");
      toast.success("Mensagem enviada.");
    });
  }

  return (
    <section aria-label="Central de conversas" className="flex h-[calc(100dvh-var(--header-height)-1.5rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_50px_-32px_color-mix(in_oklch,var(--foreground)_32%,transparent)]">
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold tracking-tight">Mensagens</h2>
            {whatsappReady ? <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-success" aria-hidden="true" />Conectado</span> : <SetupTutorialDrawer description="Vamos conectar o canal de atendimento e liberar o chat interno em poucos passos." openOnMount={setupOpen} steps={[{ id: "connect", title: "Conectar o WhatsApp", description: "Crie a sessão e leia o QR Code com o WhatsApp da operação.", href: `/settings/whatsapp?returnTo=${encodeURIComponent("/conversas?setup=whatsapp")}`, actionLabel: "Iniciar configuração do WhatsApp", icon: WhatsappLogo }, { id: "activate", title: "Ativar o chat interno", description: "Depois que a sessão estiver pronta, confirme que o chat interno está ativo.", href: `/settings/whatsapp?returnTo=${encodeURIComponent("/conversas?setup=whatsapp")}`, actionLabel: "Abrir configurações", icon: ChatCircleText }]} completedStepIds={[...(whatsappSessionReady ? ["connect"] : []), ...(whatsappReady ? ["activate"] : [])]} title="Configure o WhatsApp" triggerIcon={WhatsappLogo} triggerLabel="Iniciar configuração do WhatsApp" />}
          </div>
          {role === "director" && branches.length > 0 ? <select aria-label="Filtrar por unidade" className="h-7 rounded-md border border-border bg-muted/50 px-2 text-[11px] font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="all">Todas unidades ({branchCounts.get("all") ?? 0})</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branchCounts.get(branch.id) ?? 0})</option>)}</select> : null}
          <div className="flex items-center gap-1.5" role="group" aria-label="Filtrar conversas">
            <Tooltip><TooltipTrigger render={<FilterChip active={filter === "all"} label="Todas" count={conversations.length} onClick={() => setFilter("all")} />} /><TooltipContent side="bottom">Todas as conversas do seu escopo</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger render={<FilterChip active={filter === "with_messages"} label="Com msgs" count={conversations.filter((c) => c.messages.length > 0).length} onClick={() => setFilter("with_messages")} />} /><TooltipContent side="bottom">Contatos com histórico de mensagens</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger render={<FilterChip active={filter === "without_messages"} label="Sem conversa" count={conversations.filter((c) => c.messages.length === 0).length} onClick={() => setFilter("without_messages")} />} /><TooltipContent side="bottom">Contatos sem nenhuma mensagem trocada</TooltipContent></Tooltip>
          </div>
          <div className="relative min-w-[14rem] flex-1 lg:max-w-sm"><MagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar conversa por nome, telefone ou e-mail" className="h-9 pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa" value={query} /></div>
          <Button className="ml-auto gap-1.5" render={<Link href="/leads" />} size="sm" variant="outline"><UserList className="size-3.5" />Leads</Button>
        </div>
        {!whatsappReady ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-accent/50 px-3 py-2.5 text-xs"><div><p className="font-medium text-foreground">WhatsApp não configurado</p><p className="mt-0.5 text-muted-foreground">Você precisa conectar seu WhatsApp para enviar mensagens. A configuração é rápida — leia o QR Code com seu celular.</p></div><Button render={<Link href={`/settings/whatsapp?returnTo=${encodeURIComponent("/conversas")}`} />} size="xs" variant="outline"><WhatsappLogo /> Conectar agora</Button></div> : null}
      </header>
      <div className={cn("grid min-h-0 flex-1 lg:grid-cols-[minmax(14rem,0.5fr)_minmax(0,1.9fr)]", profileOpen ? "2xl:grid-cols-[minmax(14rem,0.5fr)_minmax(0,1.9fr)_19rem]" : "2xl:grid-cols-[minmax(14rem,0.5fr)_minmax(0,2.35fr)]")}>

        <section className={cn("flex min-h-0 flex-col border-r border-border bg-card", selected && "max-lg:hidden")} aria-label="Lista de conversas">
          <ScrollArea className="min-h-0 flex-1 bg-muted/10">
            <div className="p-2.5">
              {filtered.map((conversation) => <ConversationRow key={conversation.id} active={conversation.id === selected?.id} conversation={conversation} onClick={() => void selectConversation(conversation.id)} />)}
              {!filtered.length ? <div className="p-8 text-center"><p className="text-sm font-medium">Nenhum contato encontrado</p><p className="mt-1 text-xs text-muted-foreground">Ajuste a busca ou o filtro de conversas.</p></div> : null}
            </div>
          </ScrollArea>
        </section>

        <section className={cn("flex min-h-0 flex-col", !selected && "max-lg:hidden")} aria-live="polite">
          {selected ? <>
            <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-2"><Button aria-label="Voltar para conversas" className="max-lg:inline-flex lg:hidden" onClick={() => setSelectedId(null)} size="icon-sm" type="button" variant="ghost"><ChevronRightIcon className="rotate-180" /></Button><ContactAvatar name={selected.nome} /><div className="min-w-0"><h2 className="truncate text-sm font-semibold tracking-tight">{selected.nome}</h2><div className="mt-0.5 flex items-center gap-2"><p className="truncate text-xs text-muted-foreground">{selected.telefone}</p><Badge variant="outline">{LEAD_STATUS_LABELS[selected.status] ?? selected.status}</Badge></div></div></div>
              <div className="flex items-center gap-1"><Button aria-label="Ligar para cliente" render={<a href={`tel:${selected.telefone.replace(/\D/g, "")}`} />} size="icon-sm" variant="ghost"><Phone /></Button><Button aria-label="Abrir WhatsApp Web" render={<a href={`https://wa.me/${selected.telefone.replace(/\D/g, "")}`} rel="noreferrer" target="_blank" />} size="icon-sm" variant="ghost"><WhatsappLogo /></Button><Button aria-label="Ver lead completo" render={<Link href={`/leads/${selected.id}`} />} size="icon-sm" variant="ghost"><ArrowSquareOut /></Button></div>
              <div className="ml-auto hidden items-center gap-1 border-l border-border pl-2 2xl:flex">
                {profileOpen ? <Button aria-label="Recolher painel do cliente" onClick={() => setProfileOpen(false)} size="icon-sm" type="button" variant="ghost"><PanelLeftIcon className="rotate-180" /></Button> : <Button aria-label="Mostrar painel do cliente" onClick={() => setProfileOpen(true)} size="icon-sm" type="button" variant="ghost"><PanelLeftIcon /></Button>}
              </div>
            </header>
            <ScrollArea className="min-h-0 flex-1 bg-muted/20">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-5 lg:p-7">
                <div className="self-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">Histórico da conversa</div>
                {loadingThread ? <p className="text-center text-xs text-muted-foreground">Atualizando mensagens...</p> : null}
                {selected.messages.map((message) => <MessageBubble key={message.id} message={message} name={selected.nome} />)}
                <div ref={messagesEndRef} />
                {!selected.messages.length ? <div className="mx-auto max-w-sm py-12 text-center"><div className="mx-auto grid size-10 place-items-center rounded-full bg-muted"><ChatCircleText className="text-muted-foreground" /></div><p className="mt-3 text-sm font-medium">Ainda não há mensagens</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use uma ação rápida ou escreva a primeira mensagem para este cliente.</p></div> : null}
              </div>
            </ScrollArea>
            <footer className="relative border-t border-border bg-card p-3">
              <div className="mb-2 flex flex-wrap gap-1.5"><Button disabled={!canSend} onClick={() => insertTemplate("Olá! Preparei uma cotação para você. Posso enviar os detalhes?")} size="xs" variant="outline"><Calculator /> Enviar cotação</Button><Button disabled={!canSend} onClick={() => insertTemplate("Olá! Posso encaminhar o contrato para sua análise. Qual é o melhor horário para conversarmos?")} size="xs" variant="outline"><FileText /> Enviar contrato</Button><Button aria-expanded={plansOpen} onClick={togglePlans} size="xs" variant="outline"><ListChecks /> Lista de planos</Button></div>
              {plansOpen ? <div className="t-panel-slide absolute inset-x-3 bottom-full z-10 mb-2 rounded-lg border border-border bg-popover p-2 shadow-lg" data-open="true"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium">Planos ativos do catálogo</p><Button render={<Link href={`/cotacoes?leadId=${selected.id}`} />} size="xs" variant="link">Criar cotação <ArrowSquareOut /></Button></div><div className="grid gap-1 sm:grid-cols-2">{plans.slice(0, 6).map((plan) => <Button className="h-auto justify-start whitespace-normal py-2 text-left" key={plan.id} onClick={() => insertTemplate(`Tenho uma opção da ${plan.carrierName}: ${plan.name}. Posso explicar a cobertura?`)} size="xs" variant="ghost"><span className="min-w-0"><span className="block truncate font-medium">{plan.name}</span><span className="block truncate text-muted-foreground">{plan.carrierName}</span></span></Button>)}{!plans.length ? <p className="px-2 py-3 text-xs text-muted-foreground">Nenhum plano ativo está disponível no catálogo.</p> : null}</div></div> : null}
              {!canSend ? <ContextNote className="mb-2" title="Envio restrito ao responsável" variant="warning">Somente o corretor responsável pode enviar mensagens neste atendimento.</ContextNote> : null}
              {!whatsappReady ? <ContextNote className="mb-2" title="WhatsApp desconectado" variant="info">O envio ficará disponível quando o WhatsApp deste corretor estiver conectado.</ContextNote> : null}
              <div className="flex items-end gap-2"><Button aria-label="Adicionar modelo de mensagem" disabled={!canSend} onClick={() => insertTemplate("Olá! Como posso ajudar hoje?")} size="icon-sm" type="button" variant="outline"><Plus /></Button><Textarea aria-label="Escrever mensagem" className="min-h-10 max-h-28 resize-none" disabled={!canSend || !whatsappReady || pending} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={canSend ? "Escreva uma mensagem..." : "Aguardando responsável"} value={draft} /><Button aria-label="Enviar mensagem" disabled={!draft.trim() || !canSend || !whatsappReady || pending} onClick={sendMessage} size="icon" type="button"><PaperPlaneTilt /></Button></div>
            </footer>
          </> : <EmptyConversation />}
        </section>

        <aside className={cn("hidden min-h-0 border-l border-border bg-muted/10 2xl:flex 2xl:flex-col", !profileOpen && "2xl:hidden")} aria-label="Perfil do cliente">
          {selected ? <ClientProfile client={selected} onShowPlans={togglePlans} /> : null}
        </aside>
      </div>
    </section>
  );
}

function FilterChip({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40", active ? "border-primary/20 bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted")} onClick={onClick} type="button"><span>{label}</span><span className={cn("tabular-nums", active ? "text-primary/70" : "text-muted-foreground/60")}>{count}</span></button>;
}

function ConversationRow({ active, conversation, onClick }: { active: boolean; conversation: ConversationItem; onClick: () => void }) {
  const preview = conversation.latestMessage?.body ?? "Ainda não há uma conversa iniciada.";
  return <button aria-current={active ? "page" : undefined} className={cn("group relative flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50", active ? "border-primary/10 bg-primary/[0.03] text-foreground" : "hover:bg-muted/60")} onClick={onClick} type="button"><ContactAvatar className={cn("shrink-0", active && "ring-2 ring-primary/10 ring-offset-2 ring-offset-background")} name={conversation.nome} /><span className="grid min-w-0 flex-1 gap-1"><span className="flex min-w-0 items-center justify-between gap-3"><span className="truncate text-sm font-semibold tracking-tight">{conversation.nome}</span><span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{formatRelative(conversation.latestMessage?.sentAt ?? conversation.stageEnteredAt)}</span></span><span className="truncate text-xs leading-5 text-muted-foreground">{conversation.latestMessage?.direction === "outgoing" ? "Você: " : ""}{preview}</span><span className="flex items-center gap-1.5"><Badge className="h-4 rounded-md bg-muted px-1.5 text-[10px] text-muted-foreground group-hover:bg-background" variant="ghost">{LEAD_STATUS_LABELS[conversation.status] ?? conversation.status}</Badge>{active ? <span aria-label="Conversa selecionada" className="size-1.5 rounded-full bg-success" /> : null}</span></span></button>;
}

function MessageBubble({ message, name }: { message: ConversationMessage; name: string }) {
  const outgoing = message.direction === "outgoing";
  return <article className={cn("flex", outgoing ? "justify-end" : "justify-start")}><div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm", outgoing ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border border-border bg-card")}><p className="whitespace-pre-wrap break-words leading-6">{message.body}</p><p className={cn("mt-1.5 text-right text-[11px] tabular-nums", outgoing ? "text-primary-foreground/75" : "text-muted-foreground")}>{outgoing ? "Você" : name} · {formatTime(message.sentAt)}</p></div></article>;
}

function ClientProfile({ client, onShowPlans }: { client: ConversationItem; onShowPlans: () => void }) {
  const approvedDocuments = client.documents.filter((document) => document.status === "approved").length;
  const pendingDocuments = client.documents.filter((document) => document.status === "pending").length;
  const sharedMedia = getSharedMedia(client.messages);

  return <>
    <div className="border-b border-border bg-card px-5 py-5">
      <div className="flex items-start gap-3">
        <ContactAvatar className="size-11 text-sm" name={client.nome} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-semibold tracking-tight">{client.nome}</h2><p className="mt-0.5 truncate text-xs text-muted-foreground">{client.telefone}</p></div><Badge className="shrink-0" variant="outline">{LEAD_STATUS_LABELS[client.status] ?? client.status}</Badge></div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground"><OwnershipContext brokerName={client.corretorNome} branchName={client.branchName} /></p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ProfileAction label="Ligar" render={<a href={`tel:${client.telefone.replace(/\D/g, "")}`} />}><Phone /></ProfileAction>
        <ProfileAction label="WhatsApp" render={<a href={`https://wa.me/${client.telefone.replace(/\D/g, "")}`} rel="noreferrer" target="_blank" />}><WhatsappLogo /></ProfileAction>
        <ProfileAction label="Abrir lead" render={<Link href={`/leads/${client.id}`} />}><ArrowSquareOut /></ProfileAction>
      </div>
    </div>
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-5 p-4">
        <ConversationProfileSection title="Ações rápidas">
          <div className="grid gap-2"><Button className="w-full justify-start" render={<Link href={`/cotacoes?leadId=${client.id}`} />} size="sm"><Calculator /> Nova cotação</Button><Button className="w-full justify-start" onClick={onShowPlans} size="sm" variant="outline"><ListChecks /> Lista de planos</Button><Button className="w-full justify-start" render={<Link href={`/leads/${client.id}`} />} size="sm" variant="outline"><ListChecks /> Gerenciar tarefas</Button></div>
        </ConversationProfileSection>
        <ConversationProfileSection action={<Link className="text-[11px] font-medium text-primary hover:underline" href={`/leads/${client.id}`}>Ver todos</Link>} title="Documentos importados">
          <div className="grid grid-cols-2 gap-2"><ProfileMetric label="Aprovados" value={approvedDocuments} /><ProfileMetric label="Em análise" tone="warning" value={pendingDocuments} /></div>
          {client.documents.length ? <div className="mt-3 space-y-1.5">{client.documents.slice(0, 3).map((document) => <a className="group flex items-center gap-2 rounded-lg border border-border/70 px-2.5 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" href={document.fileUrl} key={document.id} rel="noreferrer" target="_blank"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/5 text-primary"><FileText className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{document.requirementName ?? document.filename}</span><span className="block truncate text-[11px] text-muted-foreground">{document.requirementName ? document.filename : documentStatusLabel(document.status)}</span></span><ArrowSquareOut className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>)}</div> : <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-3 text-xs leading-5 text-muted-foreground">Nenhum documento importado para este cliente.</p>}
        </ConversationProfileSection>
        <ConversationProfileSection action={<span className="text-[11px] tabular-nums text-muted-foreground">{sharedMedia.length}</span>} title="Mídias e links">
          {sharedMedia.length ? <div className="space-y-1.5">{sharedMedia.slice(0, 3).map((media) => <a className="group flex items-center gap-2 rounded-lg border border-border/70 px-2.5 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" href={media.url} key={media.url} rel="noreferrer" target="_blank"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><LinkSimple className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{media.label}</span><span className="block truncate text-[11px] text-muted-foreground">Compartilhado {formatRelative(media.sentAt)}</span></span><ArrowSquareOut className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>)}</div> : <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs leading-5 text-muted-foreground">Nenhuma mídia ou link foi identificado nesta conversa.</p>}
        </ConversationProfileSection>
        <ConversationProfileSection title="Resumo do atendimento"><dl className="grid grid-cols-2 gap-2"><ProfileTag label="Origem" value={client.origem} /><ProfileTag label="Plano de interesse" value={client.planName ?? "Não informado"} />{client.carrierName ? <ProfileTag label="Operadora" value={client.carrierName} /> : null}<ProfileTag label="Consentimento LGPD" value={client.consentimentoLgpd ? "Registrado" : "Não registrado"} tone={client.consentimentoLgpd ? "success" : "warning"} /></dl></ConversationProfileSection>
      </div>
    </ScrollArea>
  </>;
}

function ConversationProfileSection({ action, children, title }: { action?: React.ReactNode; children: React.ReactNode; title: string }) { return <section><div className="flex items-center justify-between gap-2"><h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h3>{action}</div><div className="mt-2.5">{children}</div></section>; }
function ProfileAction({ children, label, render }: { children: React.ReactNode; label: string; render: React.ReactElement }) { return <Button className="h-auto min-h-14 flex-col gap-1.5 px-2 py-2 text-[11px]" render={render} size="sm" variant="outline">{children}<span className="truncate">{label}</span></Button>; }
function ProfileMetric({ label, tone, value }: { label: string; tone?: "warning"; value: number }) { return <div className={cn("rounded-lg border px-2.5 py-2", tone === "warning" ? "border-warning/20 bg-accent/5" : "border-border bg-muted/30")}><p className="text-[11px] text-muted-foreground">{label}</p><p className={cn("mt-1 text-lg font-semibold tabular-nums", tone === "warning" && "text-warning")}>{value}</p></div>; }
function documentStatusLabel(status: string) { return status === "approved" ? "Aprovado" : status === "pending" ? "Em análise" : status === "rejected" ? "Rejeitado" : status; }
function getSharedMedia(messages: ConversationMessage[]) { const found = new Map<string, { url: string; label: string; sentAt: string }>(); for (const message of messages) { for (const match of message.body.matchAll(/https?:\/\/[^\s<]+/g)) { const url = match[0].replace(/[),.!?]+$/, ""); if (found.has(url)) continue; try { const hostname = new URL(url).hostname.replace(/^www\./, ""); found.set(url, { url, label: hostname, sentAt: message.sentAt }); } catch { /* Ignore malformed URLs. */ } } } return [...found.values()]; }

export function LegacyClientProfile({ client }: { client: ConversationItem }) {
  return <><div className="border-b border-border px-5 py-6 text-center"><ContactAvatar className="mx-auto size-14 text-base" name={client.nome} /><h2 className="mt-3 text-sm font-semibold tracking-tight">{client.nome}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Lead em atendimento</p><div className="mt-2 text-xs"><OwnershipContext brokerName={client.corretorNome} branchName={client.branchName} /></div><div className="mt-4 flex justify-center gap-2"><Button aria-label="Ligar" render={<a href={`tel:${client.telefone.replace(/\D/g, "")}`} />} size="icon-sm" variant="outline"><Phone /></Button><Button aria-label="Abrir WhatsApp" render={<a href={`https://wa.me/${client.telefone.replace(/\D/g, "")}`} rel="noreferrer" target="_blank" />} size="icon-sm" variant="outline"><WhatsappLogo /></Button><Button aria-label="Abrir lead completo" render={<Link href={`/leads/${client.id}`} />} size="icon-sm" variant="outline"><ArrowSquareOut /></Button></div></div><ScrollArea className="min-h-0 flex-1"><div className="space-y-6 p-5"><ProfileSection title="Contato"><ProfileLine label="Telefone" value={client.telefone} /><ProfileLine label="E-mail" value={client.email ?? "Não informado"} /></ProfileSection><ProfileSection title="Atendimento"><ProfileLine label="Status" value={LEAD_STATUS_LABELS[client.status] ?? client.status} /><ProfileLine label="Responsável" value={[client.corretorNome ?? "Aguardando atribuição", client.branchName ?? "Sem unidade"].join(" · ")} /><ProfileLine label="Origem" value={client.origem} /><ProfileLine label="LGPD" value={client.consentimentoLgpd ? "Consentimento registrado" : "Consentimento não registrado"} /></ProfileSection><ProfileSection title="Plano de interesse"><ProfileLine label="Plano" value={client.planName ?? "Não informado"} />{client.carrierName ? <ProfileLine label="Operadora" value={client.carrierName} /> : null}</ProfileSection><Button className="w-full" render={<Link href={`/leads/${client.id}`} />} size="sm" variant="outline"><ArrowSquareOut /> Ver perfil completo</Button><Button className="w-full" render={<Link href={`/cotacoes?leadId=${client.id}`} />} size="sm"><Calculator /> Criar cotação</Button></div></ScrollArea></>;
}

function ProfileSection({ children, title }: { children: React.ReactNode; title: string }) { return <section><h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h3><dl className="mt-2.5 space-y-3.5">{children}</dl></section>; }
function ProfileLine({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs leading-5 text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium leading-5">{value}</dd></div>; }
function ProfileTag({ label, tone, value }: { label: string; tone?: "success" | "warning"; value: string }) { return <div className="min-w-0 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-2"><dt className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</dt><dd className="mt-1 min-w-0"><Badge className="max-w-full px-1.5 text-[11px]" variant={tone ?? "outline"}><span className="truncate">{value}</span></Badge></dd></div>; }
function ContactAvatar({ className, name }: { className?: string; name: string }) { return <Avatar className={className}><AvatarFallback>{initials(name)}</AvatarFallback><AvatarBadge className="bg-success" /></Avatar>; }
function EmptyConversation() { return <div className="flex flex-1 flex-col items-center justify-center p-6 text-center"><div className="grid size-14 place-items-center rounded-full border border-border bg-muted/60"><ChatCircleText className="size-5 text-muted-foreground" /></div><h2 className="mt-4 text-sm font-semibold tracking-tight">Selecione uma conversa</h2><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Escolha um contato na lista para visualizar o histórico e enviar uma mensagem.</p></div>; }
function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatRelative(value: string) { const date = new Date(value); const diff = Date.now() - date.getTime(); if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60_000))} min`; if (diff < 24 * 60 * 60 * 1000) return formatTime(value); return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date); }
