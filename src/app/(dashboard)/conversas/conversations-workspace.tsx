"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContextNote } from "@/components/ui/context-note";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OwnershipContext } from "@/components/ownership-context";
import {
  ArrowLeft,
  ArrowSquareOut,
  Calculator,
  ChatCircleText,
  Clock,
  FileText,
  LinkSimple,
  MagnifyingGlass,
  PanelLeftIcon,
  Phone,
  UserList,
  WhatsappLogo,
} from "@/components/huge-icons";
import { EmptyState } from "@/components/empty-state";
import { LEAD_STATUS_LABELS } from "@/features/leads/lead-status-constants";
import { cn } from "@/lib/utils";

export type ConversationMessage = {
  id: string;
  leadId: string | null;
  body: string;
  direction: string;
  sentAt: string;
};

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
  documents: {
    id: string;
    filename: string;
    fileUrl: string;
    status: string;
    requirementName: string | null;
    createdAt: string;
  }[];
};

type ViewFilter = "all" | "with_messages" | "without_messages";

export function ConversationsWorkspace({
  role,
  branches,
  conversations: initialConversations,
  initialLeadId,
}: {
  role: string;
  branches: { id: string; name: string }[];
  conversations: ConversationItem[];
  initialLeadId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [conversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeadId && initialConversations.some((item) => item.id === initialLeadId)
      ? initialLeadId
      : initialConversations.find((item) => item.messages.length > 0)?.id ?? initialConversations[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [profileOpen, setProfileOpen] = useState(true);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const messagesWithHistory = useMemo(
    () => conversations.filter((conversation) => conversation.messages.length > 0).length,
    [conversations],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");

    return conversations.filter((conversation) => {
      const matchesQuery =
        !normalized ||
        [conversation.nome, conversation.telefone, conversation.email ?? ""].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalized),
        );
      const matchesFilter =
        filter === "all" ||
        (filter === "with_messages" ? conversation.messages.length > 0 : conversation.messages.length === 0);
      const matchesBranch = branchFilter === "all" || conversation.branchId === branchFilter;

      return matchesQuery && matchesFilter && matchesBranch;
    });
  }, [branchFilter, conversations, filter, query]);

  function updateSelectedLeadInUrl(leadId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (leadId) params.set("leadId", leadId);
    else params.delete("leadId");
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  function selectConversation(id: string) {
    setSelectedId(id);
    updateSelectedLeadInUrl(id);
  }

  function returnToList() {
    setSelectedId(null);
    updateSelectedLeadInUrl(null);
  }

  return (
    <section
      aria-label="Central de conversas"
      className="flex h-[calc(100dvh-var(--header-height)-1.5rem)] min-h-[34rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_50px_-32px_color-mix(in_oklch,var(--foreground)_32%,transparent)]"
    >
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight">Atendimentos</h2>
              <Badge className="tabular-nums" variant="secondary">
                {conversations.length}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Histórico e contexto de cada lead no seu escopo.</p>
          </div>

          {role === "director" && branches.length > 0 ? (
            <Select
              labels={{ all: "Todas as unidades", ...Object.fromEntries(branches.map((branch) => [branch.id, branch.name])) }}
              onValueChange={(value) => setBranchFilter(value ?? "all")}
              value={branchFilter}
            >
              <SelectTrigger aria-label="Filtrar atendimentos por unidade" className="ml-auto w-full sm:ml-0 sm:w-52" size="sm">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Button className="ml-auto" render={<Link href="/leads" />} size="sm" variant="outline">
            <UserList />
            Ver leads
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "grid min-h-0 flex-1 lg:grid-cols-[minmax(16rem,0.68fr)_minmax(0,1.65fr)]",
          profileOpen ? "2xl:grid-cols-[minmax(16rem,0.68fr)_minmax(0,1.65fr)_20rem]" : "2xl:grid-cols-[minmax(16rem,0.68fr)_minmax(0,2fr)]",
        )}
      >
        <section
          aria-label="Lista de atendimentos"
          className={cn("flex min-h-0 flex-col border-r border-border bg-card", selected && "max-lg:hidden")}
        >
          <div className="space-y-3 border-b border-border px-3 py-3">
            <div className="relative">
              <MagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar atendimento por nome, telefone ou e-mail"
                className="h-8 pl-8 text-xs"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, telefone ou e-mail"
                value={query}
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5" role="group" aria-label="Filtrar atendimentos">
              <FilterChip active={filter === "all"} count={conversations.length} label="Todos" onClick={() => setFilter("all")} />
              <FilterChip active={filter === "with_messages"} count={messagesWithHistory} label="Com histórico" onClick={() => setFilter("with_messages")} />
              <FilterChip active={filter === "without_messages"} count={conversations.length - messagesWithHistory} label="Sem histórico" onClick={() => setFilter("without_messages")} />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="p-2">
              {filtered.map((conversation) => (
                <ConversationRow
                  active={conversation.id === selected?.id}
                  conversation={conversation}
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                />
              ))}
              {!filtered.length ? <EmptyConversationList hasQuery={Boolean(query || filter !== "all" || branchFilter !== "all")} /> : null}
            </div>
          </ScrollArea>
        </section>

        <section aria-live="polite" className={cn("flex min-h-0 flex-col bg-muted/15", !selected && "max-lg:hidden")}>
          {selected ? (
            <>
              <ConversationHeader
                client={selected}
                onBack={returnToList}
                onOpenProfile={() => setProfileSheetOpen(true)}
                onToggleProfile={() => setProfileOpen((open) => !open)}
                profileOpen={profileOpen}
              />
              <ConversationHistory client={selected} />
              <ConversationChannelNotice phone={selected.telefone} />
            </>
          ) : (
            <EmptyConversation />
          )}
        </section>

        <aside
          aria-label="Perfil do cliente"
          className={cn("hidden min-h-0 border-l border-border bg-card 2xl:flex 2xl:flex-col", !profileOpen && "2xl:hidden")}
        >
          {selected ? <ClientProfile client={selected} /> : null}
        </aside>
      </div>

      <Sheet onOpenChange={setProfileSheetOpen} open={profileSheetOpen}>
        <SheetContent className="gap-0 p-0 2xl:hidden" side="right">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Perfil do atendimento</SheetTitle>
                <SheetDescription>Contexto e ações disponíveis para {selected.nome}.</SheetDescription>
              </SheetHeader>
              <ClientProfile client={selected} />
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function ConversationHeader({
  client,
  onBack,
  onOpenProfile,
  onToggleProfile,
  profileOpen,
}: {
  client: ConversationItem;
  onBack: () => void;
  onOpenProfile: () => void;
  onToggleProfile: () => void;
  profileOpen: boolean;
}) {
  return (
    <header className="flex min-h-16 items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
      <Button aria-label="Voltar para atendimentos" className="lg:hidden" onClick={onBack} size="icon-sm" type="button" variant="ghost">
        <ArrowLeft />
      </Button>
      <ContactAvatar name={client.nome} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold tracking-tight">{client.nome}</h2>
          <Badge className="hidden shrink-0 sm:inline-flex" variant="outline">
            {LEAD_STATUS_LABELS[client.status] ?? client.status}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{client.telefone}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Ligar para cliente" render={<a href={`tel:${client.telefone.replace(/\D/g, "")}`} />} size="icon-sm" variant="ghost"><Phone /></Button>} />
          <TooltipContent>Ligar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Abrir WhatsApp do cliente" render={<a href={getWhatsAppUrl(client.telefone)} rel="noreferrer" target="_blank" />} size="icon-sm" variant="ghost"><WhatsappLogo /></Button>} />
          <TooltipContent>Abrir WhatsApp</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Abrir perfil do atendimento" className="2xl:hidden" onClick={onOpenProfile} size="icon-sm" type="button" variant="ghost"><UserList /></Button>} />
          <TooltipContent>Ver perfil</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Abrir lead completo" render={<Link href={`/leads/${client.id}`} />} size="icon-sm" variant="ghost"><ArrowSquareOut /></Button>} />
          <TooltipContent>Abrir lead</TooltipContent>
        </Tooltip>
        <div className="ml-1 hidden border-l border-border pl-2 2xl:block">
          <Tooltip>
            <TooltipTrigger render={<Button aria-label={profileOpen ? "Recolher perfil do cliente" : "Mostrar perfil do cliente"} onClick={onToggleProfile} size="icon-sm" type="button" variant="ghost"><PanelLeftIcon className={cn(profileOpen && "rotate-180")} /></Button>} />
            <TooltipContent>{profileOpen ? "Recolher perfil" : "Mostrar perfil"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

function FilterChip({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active ? "border-primary/20 bg-primary/[0.08] text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <span className="tabular-nums text-[11px] opacity-75">{count}</span>
    </button>
  );
}

function ConversationRow({ active, conversation, onClick }: { active: boolean; conversation: ConversationItem; onClick: () => void }) {
  const hasHistory = conversation.messages.length > 0;
  const preview = conversation.latestMessage?.body ?? "Nenhuma mensagem sincronizada.";

  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active ? "bg-primary/[0.08]" : "hover:bg-muted/65",
      )}
      onClick={onClick}
      type="button"
    >
      <ContactAvatar className="mt-0.5 shrink-0" name={conversation.nome} />
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate text-sm font-medium">{conversation.nome}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {formatRelative(conversation.latestMessage?.sentAt ?? conversation.stageEnteredAt)}
          </span>
        </span>
        <span className="truncate text-xs leading-5 text-muted-foreground">
          {conversation.latestMessage?.direction === "outgoing" ? "Você: " : ""}
          {preview}
        </span>
        <span className="flex items-center gap-2 pt-0.5">
          <Badge className="max-w-32 truncate px-1.5 text-[10px]" variant="outline">
            {LEAD_STATUS_LABELS[conversation.status] ?? conversation.status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock aria-hidden="true" className="size-3" />
            {hasHistory ? `${conversation.messages.length} mensagens` : "Aguardando histórico"}
          </span>
        </span>
      </span>
    </button>
  );
}

function ConversationHistory({ client }: { client: ConversationItem }) {
  if (!client.messages.length) {
    return <HistoryEmptyState phone={client.telefone} />;
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-5 sm:px-6">
        <p className="mb-2 self-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Histórico sincronizado
        </p>
        {client.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </ScrollArea>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const outgoing = message.direction === "outgoing";

  return (
    <article className={cn("flex", outgoing ? "justify-end" : "justify-center")}>
      <div className={cn("max-w-[84%] rounded-xl border px-3 py-2.5 sm:max-w-[74%]", outgoing ? "border-primary/15 bg-primary/[0.08]" : "border-border bg-card")}>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{message.body}</p>
        <div className={cn("mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground", outgoing && "justify-end")}>
          <span>{outgoing ? "Enviada" : "Recebida"}</span>
          <span aria-hidden="true">•</span>
          <time dateTime={message.sentAt}>{formatMessageDateTime(message.sentAt)}</time>
        </div>
      </div>
    </article>
  );
}

function HistoryEmptyState({ phone }: { phone: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-5 sm:p-8">
      <EmptyState
        animated
        icon={ChatCircleText}
        title="Nenhuma mensagem sincronizada"
        description="Este atendimento ainda não possui histórico no CorreTop. Continue o contato pelo WhatsApp e o histórico aparecerá quando a sincronização estiver disponível."
        action={
          <Button render={<a href={getWhatsAppUrl(phone)} rel="noreferrer" target="_blank" />} size="sm">
            <WhatsappLogo />
            Abrir WhatsApp
            <ArrowSquareOut />
          </Button>
        }
      />
    </div>
  );
}

function ConversationChannelNotice({ phone }: { phone: string }) {
  return (
    <div className="border-t border-border bg-card px-4 py-3 sm:px-5">
      <ContextNote title="Envio no chat interno ainda indisponível" variant="warning">
        Use o WhatsApp para enviar novas mensagens. O histórico exibido aqui é somente leitura nesta etapa.
        <Button className="ml-2 align-middle" render={<a href={getWhatsAppUrl(phone)} rel="noreferrer" target="_blank" />} size="xs" variant="outline">
          <WhatsappLogo />
          Abrir WhatsApp
        </Button>
      </ContextNote>
    </div>
  );
}

function EmptyConversationList({ hasQuery }: { hasQuery: boolean }) {
  return (
    <EmptyState
      animated
      icon={MagnifyingGlass}
      title="Nenhum atendimento encontrado"
      description={hasQuery ? "Ajuste a busca ou os filtros para encontrar outro atendimento." : "Os atendimentos disponíveis no seu escopo aparecerão aqui."}
      className="px-5 py-12"
    />
  );
}

function EmptyConversation() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <EmptyState
        animated
        variant="ghost"
        icon={ChatCircleText}
        title="Selecione um atendimento"
        description="Escolha um contato na lista para consultar o histórico, o contexto do lead e as próximas ações."
      />
    </div>
  );
}

function ClientProfile({ client }: { client: ConversationItem }) {
  const approvedDocuments = client.documents.filter((document) => document.status === "approved").length;
  const pendingDocuments = client.documents.filter((document) => document.status === "pending").length;
  const sharedMedia = getSharedMedia(client.messages);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-start gap-3">
          <ContactAvatar className="size-11 text-sm" name={client.nome} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold tracking-tight">{client.nome}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{client.telefone}</p>
              </div>
              <Badge className="shrink-0" variant="outline">
                {LEAD_STATUS_LABELS[client.status] ?? client.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              <OwnershipContext brokerName={client.corretorNome} branchName={client.branchName} />
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <ProfileAction label="Ligar" render={<a href={`tel:${client.telefone.replace(/\D/g, "")}`} />}><Phone /></ProfileAction>
          <ProfileAction label="WhatsApp" render={<a href={getWhatsAppUrl(client.telefone)} rel="noreferrer" target="_blank" />}><WhatsappLogo /></ProfileAction>
          <ProfileAction label="Abrir lead" render={<Link href={`/leads/${client.id}`} />}><ArrowSquareOut /></ProfileAction>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <ProfileSection title="Próximas ações">
            <div className="grid gap-2 grid-cols-2">
              <Button className="w-full justify-center" render={<a href="https://cotadorsimplificado.com.br/" rel="noreferrer" target="_blank" />} size="sm">
                <Calculator />
                Nova cotação
              </Button>
              <Button className="w-full justify-center" render={<Link href={`/leads/${client.id}`} />} size="sm" variant="outline">
                <FileText />
                <p className="max-w-12.5 truncate text-ellipsis">
                  Ver tarefas e documentos

                </p>
              </Button>
              <Button className="w-full justify-center" render={<Link href={`/leads/${client.id}#documentos`} />} size="sm" variant="ghost">
                <FileText />
                Adicionar documento
              </Button>
            </div>
          </ProfileSection>

          <ProfileSection action={<Link className="text-xs font-medium text-primary hover:underline" href={`/leads/${client.id}`}>Ver todos</Link>} title="Documentos">
            <div className="grid grid-cols-2 gap-2">
              <ProfileMetric label="Aprovados" value={approvedDocuments} />
              <ProfileMetric label="Em análise" tone="warning" value={pendingDocuments} />
            </div>
            {client.documents.length ? (
              <div className="mt-3 space-y-1.5">
                {client.documents.slice(0, 3).map((document) => (
                  <a className="flex items-center gap-2 rounded-lg px-2 py-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" href={document.fileUrl} key={document.id} rel="noreferrer" target="_blank">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/[0.08] text-primary"><FileText className="size-3.5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{document.requirementName ?? document.filename}</span><span className="block truncate text-[11px] text-muted-foreground">{document.requirementName ? document.filename : documentStatusLabel(document.status)}</span></span>
                    <ArrowSquareOut className="size-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : <EmptyState variant="inline" icon={FileText} title="Nenhum documento importado." />}
          </ProfileSection>

          <ProfileSection action={<span className="text-xs tabular-nums text-muted-foreground">{sharedMedia.length}</span>} title="Links compartilhados">
            {sharedMedia.length ? (
              <div className="space-y-1.5">
                {sharedMedia.slice(0, 3).map((media) => (
                  <a className="flex items-center gap-2 rounded-lg px-2 py-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" href={media.url} key={media.url} rel="noreferrer" target="_blank">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><LinkSimple className="size-3.5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{media.label}</span><span className="block truncate text-[11px] text-muted-foreground">Compartilhado {formatRelative(media.sentAt)}</span></span>
                    <ArrowSquareOut className="size-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : <EmptyState variant="inline" icon={LinkSimple} title="Nenhum link identificado." />}
          </ProfileSection>

          <ProfileSection title="Resumo do atendimento">
            <dl className="grid grid-cols-2 gap-2">
              <ProfileTag label="Origem" value={client.origem} />
              <ProfileTag label="Plano" value={client.planName ?? "Não informado"} />
              {client.carrierName ? <ProfileTag label="Operadora" value={client.carrierName} /> : null}
              <ProfileTag label="Consentimento" tone={client.consentimentoLgpd ? "success" : "warning"} value={client.consentimentoLgpd ? "Registrado" : "Não registrado"} />
            </dl>
          </ProfileSection>
        </div>
      </ScrollArea>
    </div>
  );
}

function ProfileSection({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
  return <section><div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-foreground">{title}</h3>{action}</div><div className="mt-2.5">{children}</div></section>;
}

function ProfileAction({ children, label, render }: { children: ReactNode; label: string; render: React.ReactElement }) {
  return <Button className="h-auto min-h-14 flex-col gap-1 px-2 py-2 text-[11px]" render={render} size="sm" variant="outline">{children}<span className="truncate">{label}</span></Button>;
}

function ProfileMetric({ label, tone, value }: { label: string; tone?: "warning"; value: number }) {
  return <div className={cn("rounded-lg border border-border px-2.5 py-2", tone === "warning" && "border-warning/25 bg-accent/[0.06]")}><p className="text-[11px] text-muted-foreground">{label}</p><p className={cn("mt-1 text-lg font-semibold tabular-nums", tone === "warning" && "text-warning")}>{value}</p></div>;
}

function ProfileTag({ label, tone, value }: { label: string; tone?: "success" | "warning"; value: string }) {
  return <div className="min-w-0 rounded-lg border border-border bg-muted/25 px-2.5 py-2"><dt className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</dt><dd className={cn("mt-1 truncate text-xs font-medium", tone === "success" && "text-success", tone === "warning" && "text-warning")}>{value}</dd></div>;
}

function ContactAvatar({ className, name }: { className?: string; name: string }) {
  return <UserAvatar seed={name} name={name} className={className} />;
}

function documentStatusLabel(status: string) {
  return status === "approved" ? "Aprovado" : status === "pending" ? "Em análise" : status === "rejected" ? "Rejeitado" : status;
}

function getSharedMedia(messages: ConversationMessage[]) {
  const found = new Map<string, { url: string; label: string; sentAt: string }>();
  for (const message of messages) {
    for (const match of message.body.matchAll(/https?:\/\/[^\s<]+/g)) {
      const url = match[0].replace(/[),.!?]+$/, "");
      if (found.has(url)) continue;
      try {
        found.set(url, { url, label: new URL(url).hostname.replace(/^www\./, ""), sentAt: message.sentAt });
      } catch {
        // Ignore malformed URLs found in message text.
      }
    }
  }
  return [...found.values()];
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatMessageDateTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday ? formatTime(value) : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatRelative(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60_000))} min`;
  if (diff < 24 * 60 * 60 * 1000) return formatTime(value);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function getWhatsAppUrl(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
