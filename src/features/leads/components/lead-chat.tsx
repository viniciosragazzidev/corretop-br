"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowSquareOut, ChatCircleText, PaperPlaneTilt, ShieldWarning, WhatsappLogo } from "@/components/huge-icons";
import { toast } from "sonner";
import { getLeadMessagesAction, sendLeadMessageAction } from "../actions/send-lead-message";
import { assumeLeadForMessagingAction } from "../management-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogPopup, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Message = { id: string; body: string; direction: string; sentAt: Date };
const quickReplies = ["Bom dia! Tudo bem?", "Ainda tem interesse?", "Vou enviar a cotação."];

export function LeadChat({ leadId, messages: initialMessages, phone, active, canSend, canAssume }: { leadId: string; messages: Message[]; phone: string | null; active: boolean; canSend: boolean; canAssume: boolean }) {
  const pathname = usePathname();
  const [messages, setMessages] = useState(initialMessages);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const directUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;

  useEffect(() => {
    const refresh = async () => { try { const result = await getLeadMessagesAction(leadId); if (result.success) setMessages(result.messages); else console.warn("[Chat] falha ao carregar mensagens", result.error); } catch (error) { console.warn("[Chat] erro ao atualizar mensagens", error); } };
    void refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => window.clearInterval(timer);
  }, [leadId]);

  function send() {
    if (!canSend || !draft.trim() || pending) return;
    const text = draft;
    startTransition(async () => {
      const result = await sendLeadMessageAction(leadId, text);
      if (!result.success || !result.message) { toast.error(result.error); return; }
      setMessages((current) => [...current, result.message!]); setDraft(""); toast.success("Mensagem enviada pelo WhatsApp.");
    });
  }

  function assume() {
    if (pending) return;
    startTransition(async () => {
      const result = await assumeLeadForMessagingAction(leadId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Atendimento assumido. Você já pode responder ao lead.");
      window.location.reload();
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<button aria-label="Abrir chat do atendimento" className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border border-primary/20 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-px"><span className="relative grid size-8 place-items-center rounded-full bg-primary-foreground/15"><ChatCircleText size={18} />{messages.length ? <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-success px-1 text-[10px] leading-4 text-success-foreground">{messages.length > 9 ? "9+" : messages.length}</span> : null}</span><span className="hidden sm:inline">Chat do atendimento</span></button>} />
    <DialogPopup className="h-[80vh] w-[70vw] max-w-none overflow-hidden p-0 max-lg:w-[86vw] max-sm:h-[88vh] max-sm:w-[calc(100vw-1rem)]" overlayClassName="bg-black/65 backdrop-blur-sm">
      <div className="flex h-full min-h-0 flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border bg-card px-6 py-4"><span className="grid size-10 place-items-center rounded-full bg-success/10 text-success"><ChatCircleText size={21} /></span><div className="min-w-0"><DialogTitle>Atendimento do lead</DialogTitle><DialogDescription className="truncate">{active ? "Canal interno ativo" : "Canal interno desativado"}</DialogDescription></div><span className={`ml-auto size-2.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground"}`} />{directUrl ? <Button className="hidden sm:inline-flex" render={<a href={directUrl} rel="noreferrer" target="_blank" />} size="sm" variant="outline"><ArrowSquareOut /> WhatsApp direto</Button> : null}</header>
        <div className="flex min-h-0 flex-1 flex-col">
          {!active && canSend ? <div className="m-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5"><div><p className="text-sm font-medium text-warning-foreground">WhatsApp não configurado</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Você precisa conectar seu WhatsApp para enviar mensagens. A configuração é rápida — leia o QR Code com seu celular.</p></div><Button className="shrink-0" render={<Link href={`/settings/whatsapp?returnTo=${encodeURIComponent(pathname)}`} />} size="sm" variant="outline"><WhatsappLogo /> Conectar agora</Button></div> : <>
            <div className="border-b border-warning/20 bg-warning/10 px-6 py-3"><div className="flex items-start gap-2"><ShieldWarning className="mt-0.5 shrink-0 text-warning" size={16} /><p className="text-xs leading-4 text-warning-foreground">Apenas mensagens relacionadas a este lead aparecem aqui.</p></div></div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/10 px-6 py-6">{messages.length ? messages.map((message) => <div className={`flex ${message.direction === "outgoing" ? "justify-end" : "justify-start"}`} key={message.id}><div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.direction === "outgoing" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card text-foreground ring-1 ring-border"}`}><p className="whitespace-pre-wrap leading-5">{message.body}</p><p className={`mt-1 text-[10px] ${message.direction === "outgoing" ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(message.sentAt))}</p></div></div>) : <div className="flex h-full min-h-52 flex-col items-center justify-center text-center text-muted-foreground"><span className="mb-3 grid size-12 place-items-center rounded-full bg-muted"><ChatCircleText size={24} /></span><p className="text-sm font-medium text-foreground">Comece a conversa</p><p className="mt-1 max-w-52 text-xs">Envie uma mensagem para iniciar o atendimento.</p></div>}</div>
            {!canSend && canAssume ? <div className="border-t border-warning/20 bg-warning/10 px-5 py-4"><p className="text-sm font-medium text-foreground">Atendimento sob responsabilidade de outro corretor</p><p className="mt-1 text-xs text-muted-foreground">Você pode visualizar as mensagens. Para responder, assuma formalmente este atendimento.</p><Button className="mt-3" disabled={pending} onClick={assume} size="sm">{pending ? "Assumindo..." : "Assumir atendimento e responder"}</Button></div> : canSend ? <footer className="border-t border-border bg-card px-5 pb-5 pt-3"><div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">{quickReplies.map((reply) => <button className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" key={reply} onClick={() => setDraft(reply)} type="button">{reply}</button>)}</div><div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-ring"><textarea aria-label="Mensagem para o lead" className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-5 outline-none placeholder:text-muted-foreground" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); send(); } }} placeholder="Escreva uma mensagem..." value={draft} /><Button aria-label="Enviar mensagem" className="size-9 rounded-full" disabled={pending || !draft.trim()} onClick={send} size="icon"><PaperPlaneTilt /></Button></div><div className="mt-2 flex items-center justify-between px-1"><span className="text-[10px] text-muted-foreground">Ctrl/Cmd + Enter envia</span>{directUrl ? <a className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline sm:hidden" href={directUrl} rel="noreferrer" target="_blank">WhatsApp direto <ArrowSquareOut size={12} /></a> : null}</div></footer> : <div className="border-t border-border bg-card px-5 py-4 text-xs text-muted-foreground">Somente o corretor responsável pode responder a este atendimento.</div>}
          </>}
        </div>
      </div>
    </DialogPopup>
  </Dialog>;
}
