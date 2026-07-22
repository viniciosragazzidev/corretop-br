import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeMetaEmbeddedSignupAction, setMetaCloudChannelStatusAction } from "../actions";

type Channel = {
  id: string;
  branchId: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  branchName: string | null;
  status: string;
  qualityRating: string | null;
  messagingLimit: string | null;
  businessId: string | null;
  wabaId: string | null;
  phoneNumberId: string | null;
  lastWebhookAt: Date | null;
  activatedAt: Date | null;
  tokenExpiresAt: Date | null;
  isDefault: boolean;
};
type SignupMetadata = { businessId: string; wabaId: string; phoneNumberId: string };
type FacebookLoginResponse = { authResponse?: { code?: string } };

declare global {
  interface Window {
    FB?: { init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void; login: (callback: (response: FacebookLoginResponse) => void, options: Record<string, unknown>) => void };
  }
}

function readSignupMessage(value: unknown): SignupMetadata | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { type?: unknown; event?: unknown; data?: unknown };
  if (record.type !== "WA_EMBEDDED_SIGNUP" || record.event !== "FINISH" || !record.data || typeof record.data !== "object") return null;
  const data = record.data as { business_id?: unknown; waba_id?: unknown; phone_number_id?: unknown };
  if (![data.business_id, data.waba_id, data.phone_number_id].every((item) => typeof item === "string" && /^\d{5,40}$/.test(item))) return null;
  return { businessId: data.business_id as string, wabaId: data.waba_id as string, phoneNumberId: data.phone_number_id as string };
}

function formatDate(value: Date | null) {
  if (!value) return "Ainda não sincronizado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function accountStatus(account: Channel | null, enabled: boolean, configured: boolean) {
  if (!enabled) return { label: "Desativada pelo Super-admin", tone: "border-warning/30 bg-warning/10 text-warning-foreground" };
  if (!configured) return { label: "Configuração incompleta", tone: "border-warning/30 bg-warning/10 text-warning-foreground" };
  if (!account) return { label: "Não conectada", tone: "border-border bg-muted/30 text-muted-foreground" };
  if (account.status === "active") return { label: "Ativa", tone: "border-success/30 bg-success/10 text-success-foreground" };
  return { label: "Pausada", tone: "border-warning/30 bg-warning/10 text-warning-foreground" };
}

export function MetaCloudSetupCard({ enabled, configured, missing, appId, configId, canConfigure, companyAccount }: { enabled: boolean; configured: boolean; missing: string[]; appId: string | null; configId: string | null; canConfigure: boolean; branches?: { id: string; name: string }[]; channels: Channel[]; companyAccount: Channel | null }) {
  const [code, setCode] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SignupMetadata | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submitted = useRef(false);
  const status = accountStatus(companyAccount, enabled, configured);

  useEffect(() => {
    if (!appId || !configId || !enabled) return;
    const existing = document.getElementById("meta-facebook-sdk") as HTMLScriptElement | null;
    const initialize = () => { window.FB?.init({ appId, cookie: true, xfbml: false, version: "v23.0" }); setSdkReady(Boolean(window.FB)); };
    if (existing) { if (window.FB) initialize(); else existing.addEventListener("load", initialize, { once: true }); return; }
    const script = document.createElement("script");
    script.id = "meta-facebook-sdk"; script.async = true; script.defer = true; script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.addEventListener("load", initialize, { once: true }); document.body.appendChild(script);
    return () => script.removeEventListener("load", initialize);
  }, [appId, configId, enabled]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      let value = event.data;
      if (typeof value === "string") { try { value = JSON.parse(value) as unknown; } catch { return; } }
      const next = readSignupMessage(value);
      if (next) setMetadata(next);
    };
    window.addEventListener("message", onMessage); return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!code || !metadata || submitted.current) return;
    submitted.current = true;
    startTransition(async () => {
      try { const result = await completeMetaEmbeddedSignupAction({ code, ...metadata }); toast.success("Canal oficial conectado.", { description: result.displayPhoneNumber ?? "A conta empresarial já pode enviar e receber mensagens." }); window.location.reload(); }
      catch (error) { submitted.current = false; setCode(null); toast.error(error instanceof Error ? error.message : "Não foi possível concluir a conexão oficial."); }
    });
  }, [code, metadata]);

  function startSignup() {
    if (!window.FB || !configId) { toast.error("O SDK da Meta ainda está carregando. Tente novamente em alguns segundos."); return; }
    submitted.current = false; setCode(null); setMetadata(null);
    window.FB.login((response) => { const nextCode = response.authResponse?.code; if (!nextCode) { toast.error("A Meta não devolveu o código de autorização. Tente novamente."); return; } setCode(nextCode); }, { config_id: configId, response_type: "code", override_default_response_type: true, extras: { feature: "whatsapp_embedded_signup" } });
  }

  function toggleStatus() {
    if (!companyAccount) return;
    startTransition(async () => {
      try { await setMetaCloudChannelStatusAction(companyAccount.id, companyAccount.status !== "active"); window.location.reload(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível alterar o status da conta."); }
    });
  }

  return <Card className="border-border bg-card shadow-none">
    <CardHeader>
      <CardTitle>Status da conta WhatsApp da empresa</CardTitle>
      <CardDescription>Uma visão única da conta oficial da Meta que atende todas as unidades. Tokens permanecem cifrados no servidor.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div aria-live="polite" className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${status.tone}`}>
        <div><p className="text-xs font-medium uppercase tracking-wide opacity-80">Status operacional</p><p className="mt-1 text-lg font-semibold">{status.label}</p></div>
        {canConfigure && companyAccount ? <Button disabled={isPending} onClick={toggleStatus} type="button" variant="outline">{companyAccount.status === "active" ? "Pausar conta" : "Ativar conta"}</Button> : null}
      </div>
      {!enabled ? <p className="text-sm text-muted-foreground">A capacidade foi desativada globalmente pelo Super-admin.</p> : null}
      {enabled && !configured ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"><p className="font-medium">Faltam variáveis seguras no ambiente</p><p className="mt-1 text-muted-foreground">Configure no ambiente de produção: {missing.join(", ")}.</p></div> : null}
      {enabled && configured && !companyAccount ? <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-3"><div className="flex-1"><p className="text-sm font-medium">Nenhuma conta empresarial conectada</p><p className="mt-1 text-xs text-muted-foreground">Conecte a WABA e o número oficial para liberar o canal para a corretora.</p></div>{canConfigure ? <Button disabled={!sdkReady || isPending} onClick={startSignup} type="button">{isPending ? "Concluindo conexão..." : "Conectar conta oficial"}</Button> : null}</div> : null}
      {companyAccount ? <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="text-xs text-muted-foreground">Nome verificado</p><p className="mt-1 text-sm font-medium">{companyAccount.verifiedName ?? "Não informado"}</p></div>
        <div><p className="text-xs text-muted-foreground">Número oficial</p><p className="mt-1 text-sm font-medium">{companyAccount.displayPhoneNumber ?? "Não informado"}</p></div>
        <div><p className="text-xs text-muted-foreground">Qualidade</p><p className="mt-1 text-sm font-medium">{companyAccount.qualityRating ?? "Ainda não disponível"}</p></div>
        <div><p className="text-xs text-muted-foreground">Limite de mensagens</p><p className="mt-1 text-sm font-medium">{companyAccount.messagingLimit ?? "Não informado"}</p></div>
        <div><p className="text-xs text-muted-foreground">Último webhook</p><p className="mt-1 text-sm font-medium">{formatDate(companyAccount.lastWebhookAt)}</p></div>
        <div><p className="text-xs text-muted-foreground">Ativada em</p><p className="mt-1 text-sm font-medium">{formatDate(companyAccount.activatedAt)}</p></div>
        <div><p className="text-xs text-muted-foreground">Business ID</p><p className="mt-1 break-all font-mono text-xs">{companyAccount.businessId ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">WABA ID</p><p className="mt-1 break-all font-mono text-xs">{companyAccount.wabaId ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Phone Number ID</p><p className="mt-1 break-all font-mono text-xs">{companyAccount.phoneNumberId ?? "—"}</p></div>
      </div> : null}
      {enabled && configured && companyAccount && canConfigure ? <p className="text-xs text-muted-foreground">A alteração de status é aplicada à conta corporativa e registrada para auditoria.</p> : null}
      {enabled && configured && !canConfigure ? <p className="text-sm text-muted-foreground">A conexão e o status da conta empresarial são administrados exclusivamente pelo Diretor.</p> : null}
    </CardContent>
  </Card>;
}
