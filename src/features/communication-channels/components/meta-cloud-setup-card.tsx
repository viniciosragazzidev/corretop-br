import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeMetaEmbeddedSignupAction, setMetaCloudChannelStatusAction } from "../actions";

type Channel = { id: string; displayPhoneNumber: string | null; verifiedName: string | null; branchName: string | null; status: string; qualityRating: string | null; isDefault: boolean };
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

export function MetaCloudSetupCard({ enabled, configured, missing, appId, configId, canConfigure, channels }: { enabled: boolean; configured: boolean; missing: string[]; appId: string | null; configId: string | null; canConfigure: boolean; branches?: { id: string; name: string }[]; channels: Channel[] }) {
  const [code, setCode] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SignupMetadata | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submitted = useRef(false);

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
      try { const result = await completeMetaEmbeddedSignupAction({ code, ...metadata }); toast.success("Canal oficial conectado.", { description: result.displayPhoneNumber ?? "A Meta já pode enviar e receber mensagens neste canal." }); window.location.reload(); }
      catch (error) { submitted.current = false; setCode(null); toast.error(error instanceof Error ? error.message : "Não foi possível concluir a conexão oficial."); }
    });
  }, [code, metadata]);

  function startSignup() {
    if (!window.FB || !configId) { toast.error("O SDK da Meta ainda está carregando. Tente novamente em alguns segundos."); return; }
    submitted.current = false; setCode(null); setMetadata(null);
    window.FB.login((response) => { const nextCode = response.authResponse?.code; if (!nextCode) { toast.error("A Meta não devolveu o código de autorização. Tente novamente."); return; } setCode(nextCode); }, { config_id: configId, response_type: "code", override_default_response_type: true, extras: { feature: "whatsapp_embedded_signup" } });
  }

  return <Card className="border-border bg-card shadow-none">
    <CardHeader><CardTitle>WhatsApp oficial da Meta</CardTitle><CardDescription>Canal corporativo conectado pelo Embedded Signup. Tokens ficam cifrados no servidor; nenhum segredo é enviado ao navegador.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {!enabled ? <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-muted-foreground">A capacidade está desativada globalmente pelo Super-admin.</p> : null}
      {enabled && !configured ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"><p className="font-medium">Faltam variáveis seguras no ambiente</p><p className="mt-1 text-muted-foreground">Configure no Vercel: {missing.join(", ")}.</p></div> : null}
      {enabled && configured && canConfigure ? <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-3"><Button disabled={!sdkReady || isPending} onClick={startSignup} type="button">{isPending ? "Concluindo conexão..." : "Conectar número oficial"}</Button><p className="text-xs text-muted-foreground">Este canal é corporativo e alimenta todas as unidades da corretora. A Meta abrirá o cadastro da WABA e do número.</p></div> : null}
      {enabled && configured && !canConfigure ? <p className="text-sm text-muted-foreground">A conexão de novos canais oficiais é exclusiva do Diretor da corretora.</p> : null}
      <div className="divide-y divide-border rounded-lg border border-border">{channels.length ? channels.map((channel) => <div className="flex flex-wrap items-center justify-between gap-3 p-3" key={channel.id}><div><p className="text-sm font-medium">{channel.displayPhoneNumber ?? "Número oficial"}{channel.isDefault ? " · padrão" : ""}</p><p className="text-xs text-muted-foreground">{channel.verifiedName ?? "Sem nome verificado"}{channel.branchName ? ` · ${channel.branchName}` : " · Toda a corretora"}{channel.qualityRating ? ` · Qualidade ${channel.qualityRating}` : ""}</p></div><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{channel.status === "active" ? "Ativo" : "Pausado"}</span>{canConfigure ? <Button disabled={isPending} onClick={() => startTransition(async () => { try { await setMetaCloudChannelStatusAction(channel.id, channel.status !== "active"); window.location.reload(); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível alterar o canal."); } })} size="sm" type="button" variant="outline">{channel.status === "active" ? "Pausar" : "Ativar"}</Button> : null}</div></div>) : <p className="p-3 text-sm text-muted-foreground">Nenhum número oficial conectado ainda.</p>}</div>
    </CardContent>
  </Card>;
}
