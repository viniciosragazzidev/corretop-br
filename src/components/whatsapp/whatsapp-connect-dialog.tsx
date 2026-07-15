"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, LockKey, WhatsappLogo } from "@/components/huge-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogPopup, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getWhatsAppConnection, getWhatsAppSessionStatus, refreshWhatsAppQr, resetWhatsAppSessionAction, startWhatsAppConnection, toggleWhatsAppChatAction } from "@/app/(dashboard)/settings/whatsapp-actions";

type Connection = Awaited<ReturnType<typeof getWhatsAppConnection>>;

export function WhatsAppConnectDialog({ initial, returnTo, triggerLabel = "Conectar WhatsApp" }: { initial: Connection; returnTo?: string; triggerLabel?: string }) {
  const router = useRouter();
  const [connection, setConnection] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const previousStatus = useRef(initial.status);
  const polling = useRef(false);
  const ready = connection.status === "ready";
  const statusLabel = ready ? "Conectado" : connection.status === "initializing" ? "Iniciando" : connection.status === "qr_ready" ? "Aguardando leitura" : "Desconectado";

  function updateStatus(status: string) {
    previousStatus.current = status;
    setConnection((current) => ({ ...current, status, qrCode: status === "ready" ? null : current.qrCode, chatInternoAtivo: status === "ready" ? true : current.chatInternoAtivo }));
  }

  async function pollStatus() {
    if (polling.current) return;
    polling.current = true;
    try {
      const result = await getWhatsAppSessionStatus();
      if (!result.success || !result.status) return;
      if (result.status === "ready") {
        const wasReady = previousStatus.current === "ready";
        updateStatus("ready");
        if (!wasReady) toast.success("WhatsApp conectado. O chat interno está ativo.");
        setOpen(false);
        router.refresh();
        if (returnTo) router.replace(returnTo);
      } else updateStatus(result.status);
    } finally { polling.current = false; }
  }

  useEffect(() => {
    if (!open || !connection.sessionId || connection.status === "ready") return;
    void pollStatus();
    const timer = window.setInterval(() => startTransition(async () => pollStatus()), 700);
    return () => window.clearInterval(timer);
  }, [open, connection.sessionId, connection.status]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && connection.sessionId && connection.status !== "ready") {
      startTransition(async () => { await pollStatus(); router.refresh(); });
    }
  }

  function start() { startTransition(async () => { if (connection.sessionId) { await resetWhatsAppSessionAction(); setConnection((current) => ({ ...current, sessionId: null, qrCode: null, status: "disconnected" })); } const result = await startWhatsAppConnection(); if (!result.success) { toast.error(result.error); return; } toast.success("Sessão iniciada. Escaneie o QR Code."); const qr = await refreshWhatsAppQr(); if (qr.success) setConnection((current) => ({ ...current, qrCode: qr.qrCode ?? current.qrCode, status: qr.status ?? "initializing" })); await pollStatus(); }); }
  function refresh() { startTransition(async () => { const result = await refreshWhatsAppQr(); if (!result.success) toast.error(result.error); else { setConnection((current) => ({ ...current, qrCode: result.qrCode ?? current.qrCode, status: result.status ?? current.status })); await pollStatus(); } }); }
  function toggle() { startTransition(async () => { const result = await toggleWhatsAppChatAction(); if (!result.success) toast.error(result.error); else { setConnection((current) => ({ ...current, chatInternoAtivo: result.active ?? current.chatInternoAtivo })); toast.success(result.active ? "Chat interno ativado." : "Chat interno desativado."); } }); }

  return <Dialog open={open} onOpenChange={handleOpenChange}><DialogTrigger render={<Button variant={ready ? "outline" : "default"}><WhatsappLogo /> {ready ? "WhatsApp conectado" : triggerLabel}</Button>} /><DialogPopup className="max-w-2xl"><div className="flex items-start justify-between gap-4"><div><DialogTitle className="flex items-center gap-2"><WhatsappLogo className="text-success" /> Conectar WhatsApp</DialogTitle><DialogDescription className="mt-2">Leia o QR Code no WhatsApp. O status é verificado em tempo real.</DialogDescription></div><Badge variant={ready ? "success" : "outline"}>{statusLabel}</Badge></div><div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem]"><div className="space-y-4"><div className="rounded-lg border border-border bg-muted/30 p-4"><p className="text-sm font-semibold">Chat interno {connection.chatInternoAtivo ? "ativo" : "desativado"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Se o pareamento for interrompido, use “Nova sessão” para gerar um QR Code limpo.</p></div><div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={start}>{connection.sessionId ? "Nova sessão" : "Gerar sessão"}</Button><Button disabled={pending || !connection.sessionId} onClick={refresh} variant="outline">Atualizar QR</Button><Button disabled={pending || !ready} onClick={toggle} variant="outline">{connection.chatInternoAtivo ? "Desativar chat" : "Ativar chat"}</Button></div></div><div className="flex min-h-56 items-center justify-center rounded-lg bg-white p-3">{connection.qrCode && !ready ? <img alt="QR Code para conectar o WhatsApp" className="size-48" src={connection.qrCode} /> : <div className="text-center text-slate-600">{ready ? <CheckCircle className="mx-auto size-9 text-emerald-600" /> : <LockKey className="mx-auto size-7" />}<p className="mt-2 text-xs font-medium">{ready ? "Dispositivo conectado" : connection.sessionId ? "Aguardando QR Code..." : "Gere uma sessão"}</p></div>}</div></div></DialogPopup></Dialog>;
}
