"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, HelpCircle, LinkSimple, Plus, ShieldCheck, Trash, WifiHigh, X } from "@/components/huge-icons";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createIntegrationAction, getIntegrationsData, revokeIntegrationAction, toggleIntegrationAction, type IntegrationRecord } from "../integrations-actions";

type Branch = { id: string; name: string };
type Props = { integrations: IntegrationRecord[]; branches: Branch[] };
type QueryData = { integrations: IntegrationRecord[]; branches: Branch[] };

const sourceLabel: Record<string, string> = { site_pixel: "Pixel / Site", meta_ads: "Meta Lead Ads", landing_page: "Landing page" };

export function IntegrationsTab({ integrations, branches }: Props) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(integrations[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<{ leadId?: string; code?: string; message?: string } | null>(null);
  const testNameRef = useRef<HTMLInputElement>(null);
  const testPhoneRef = useRef<HTMLInputElement>(null);
  const testEmailRef = useRef<HTMLInputElement>(null);

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !revealedToken) return;
    setTestStatus("loading");
    setTestResult(null);
    try {
      const res = await fetch("/api/webhooks/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + revealedToken,
          "Idempotency-Key": "test-" + Date.now(),
        },
        body: JSON.stringify({
          name: testNameRef.current?.value || "Lead de Teste",
          phone: testPhoneRef.current?.value || "+5511999999999",
          email: testEmailRef.current?.value || undefined,
          source: "teste-integracao",
          metadata: { via: "painel_teste" },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus("success");
        setTestResult({ leadId: data.data?.leadId });
        toast.success("Lead de teste criado com sucesso!");
      } else {
        setTestStatus("error");
        setTestResult({ code: data.error?.code, message: data.error?.message });
      }
    } catch {
      setTestStatus("error");
      setTestResult({ code: "NETWORK_ERROR", message: "Sem conexão com o servidor." });
    }
  }

  const query = useQuery<QueryData>({ queryKey: ["settings-integrations"], queryFn: async () => ({ integrations, branches }), initialData: { integrations, branches }, staleTime: 30_000 });
  const data = query.data;
  const selected = data.integrations.find((item) => item.id === selectedId) ?? data.integrations[0] ?? null;

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => createIntegrationAction({}, formData),
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ["settings-integrations"] });
      const previous = queryClient.getQueryData<QueryData>(["settings-integrations"]);
      const branchId = String(formData.get("branchId") ?? "") || null;
      const optimistic: IntegrationRecord = { id: `temp-${crypto.randomUUID()}`, name: String(formData.get("name") ?? "Nova fonte"), source: String(formData.get("source") ?? "site_pixel"), branchId, branchName: data.branches.find((branch) => branch.id === branchId)?.name ?? null, status: "active", tokenPrefix: "sincronizando⬦", createdAt: new Date() };
      queryClient.setQueryData<QueryData>(["settings-integrations"], { ...data, integrations: [optimistic, ...data.integrations] });
      setSelectedId(optimistic.id);
      setCreateOpen(false);
      return { previous, optimisticId: optimistic.id };
    },
    onSuccess: (result, _formData, context) => {
      if (!result.success || !result.integration || !context) { toast.error(result.error ?? "Não foi possível criar a integração."); return; }
      queryClient.setQueryData<QueryData>(["settings-integrations"], (current) => current ? { ...current, integrations: current.integrations.map((item) => item.id === context.optimisticId ? { ...result.integration!, branchName: current.branches.find((branch) => branch.id === result.integration!.branchId)?.name ?? null } : item) } : current);
      setSelectedId(result.integration.id);
      setRevealedToken(result.token ?? null);
      toast.success("Fonte de captura criada.");
    },
    onError: (_error, _formData, context) => { if (context?.previous) queryClient.setQueryData(["settings-integrations"], context.previous); toast.error("Não foi possível criar a integração."); },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => { const form = new FormData(); form.set("id", id); return toggleIntegrationAction(form); },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["settings-integrations"] });
      const previous = queryClient.getQueryData<QueryData>(["settings-integrations"]);
      queryClient.setQueryData<QueryData>(["settings-integrations"], (current) => current ? { ...current, integrations: current.integrations.map((item) => item.id === id ? { ...item, status: item.status === "active" ? "revoked" : "active" } : item) } : current);
      return { previous };
    },
    onSuccess: (result) => { if (!result.success) { queryClient.invalidateQueries({ queryKey: ["settings-integrations"] }); toast.error(result.error); return; } toast.success("Status da integração atualizado."); },
    onError: (_error, _id, context) => { if (context?.previous) queryClient.setQueryData(["settings-integrations"], context.previous); toast.error("Não foi possível atualizar o status."); },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => { const form = new FormData(); form.set("id", id); return revokeIntegrationAction(form); },
    onSuccess: (_result, id) => { queryClient.setQueryData<QueryData>(["settings-integrations"], (current) => current ? { ...current, integrations: current.integrations.filter((item) => item.id !== id) } : current); setSelectedId(null); toast.success("Integração revogada."); },
    onError: () => toast.error("Não foi possível revogar a integração."),
  });

  const snippet = useMemo(() => selected ? `<script>\n  window.CORRETOP_HUB_URL = "${typeof window !== "undefined" ? window.location.origin : "https://app.corretop.com"}/api/webhooks/leads";\n  window.CORRETOP_HUB_TOKEN = "${revealedToken ?? `${selected.tokenPrefix}⬢⬢⬢⬢⬢⬢⬢⬢`}";\n</script>` : "", [revealedToken, selected]);
  async function copySnippet() { await navigator.clipboard.writeText(snippet); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }

  return <Tabs className="gap-5" defaultValue="sources">
    <TabsList variant="line" className="w-full justify-start border-b border-border">
      <TabsTrigger value="sources"><LinkSimple /> Webhooks & Pixels</TabsTrigger>
      <TabsTrigger value="meta"><WifiHigh /> Meta Lead Ads</TabsTrigger>
    </TabsList>
    <TabsContent value="sources" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border"><div className="flex items-center gap-2"><CardTitle>Fontes de captura</CardTitle><button type="button" onClick={() => setHelpOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors" title="Como integrar em um site externo?"><HelpCircle className="size-4" /></button></div><Button onClick={() => setCreateOpen(true)} size="sm"><Plus /> Nova fonte</Button></CardHeader>
        <CardContent className="p-0"><div className="divide-y divide-border">
          {data.integrations.map((item) => <button className={`grid w-full grid-cols-[1fr_auto] gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${selected?.id === item.id ? "bg-muted/30" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium">{item.name}</span>{item.id.startsWith("temp-") ? <Badge variant="secondary">Sincronizando</Badge> : null}</span><span className="mt-1 block text-xs text-muted-foreground">{sourceLabel[item.source] ?? item.source} · {item.branchName ?? "Primeira filial ativa"}</span></span><span className="flex items-center gap-3"><span className={`size-2 rounded-full ${item.status === "active" ? "bg-emerald-400" : "bg-muted-foreground"}`} /><span className="text-xs text-muted-foreground">{item.status === "active" ? "Ativo" : "Inativo"}</span></span></button>)}
          {!data.integrations.length ? <div className="p-10 text-center"><ShieldCheck className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Nenhuma fonte configurada</p><p className="mt-1 text-xs text-muted-foreground">Crie um token para começar a receber leads automaticamente.</p></div> : null}
        </div></CardContent>
      </Card>
      {selected ? <Card className="h-fit border-border bg-card shadow-none"><CardHeader><CardTitle className="text-base">Configuração da fonte</CardTitle><CardDescription>{selected.name}</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="grid gap-1"><span className="text-xs text-muted-foreground">Token</span><code className="rounded-md bg-muted px-2.5 py-2 text-xs">{selected.tokenPrefix}⬢⬢⬢⬢⬢⬢⬢⬢</code><span className="text-[11px] text-muted-foreground">O token completo só é exibido uma vez após a criação.</span></div><div className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="text-sm font-medium">Recebimento</p><p className="text-xs text-muted-foreground">{selected.status === "active" ? "Aceitando novos leads" : "Bloqueado"}</p></div><Button aria-label="Alternar status" onClick={() => toggleMutation.mutate(selected.id)} size="sm" variant="outline">{selected.status === "active" ? "Desativar" : "Ativar"}</Button></div><div className="grid gap-2"><div className="flex items-center justify-between"><span className="flex items-center gap-1 text-xs font-medium">Snippet do hub <button type="button" onClick={() => setHelpOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors" title="Como integrar em um site externo?"><HelpCircle className="size-3.5" /></button></span><Button onClick={copySnippet} size="sm" variant="ghost">{copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}</Button></div><pre className="max-h-44 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-5 text-muted-foreground">{snippet}</pre></div>

        {/* Painel de Teste */}
        <div className="rounded-lg border border-border">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
            onClick={() => { setTestOpen((v) => !v); setTestStatus("idle"); setTestResult(null); }}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="size-4 text-primary" />
              Testar integração
            </span>
            <span className="text-xs text-muted-foreground">{testOpen ? "Fechar" : "Abrir"}</span>
          </button>

          {testOpen && (
            <div className="border-t border-border p-4">
              {!revealedToken ? (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Token não disponível</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">O token completo só é visível logo após a criação da integração. Crie uma nova fonte para testar, ou use o curl na aba Guia.</p>
                </div>
              ) : (
                <form onSubmit={handleTest} className="grid gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium">Nome <span className="text-muted-foreground">(obrigatório)</span></label>
                    <Input ref={testNameRef} placeholder="Ex: Maria da Silva" defaultValue="Lead de Teste" className="h-8 text-xs" />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium">Telefone <span className="text-muted-foreground">(obrigatório)</span></label>
                    <Input ref={testPhoneRef} placeholder="+5511999999999" defaultValue="+5511999999999" className="h-8 text-xs" />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium">E-mail <span className="text-muted-foreground">(opcional)</span></label>
                    <Input ref={testEmailRef} type="email" placeholder="teste@email.com" className="h-8 text-xs" />
                  </div>

                  <Button type="submit" size="sm" disabled={testStatus === "loading"} className="w-full">
                    {testStatus === "loading" ? "Enviando..." : <><FlaskConical className="size-3.5" /> Enviar lead de teste</>}
                  </Button>

                  {testStatus === "success" && testResult && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Webhook funcionando!</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground font-mono">Lead ID: {testResult.leadId}</p>
                    </div>
                  )}

                  {testStatus === "error" && testResult && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                      <p className="text-xs font-semibold text-destructive">✗ Falha no envio</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{testResult.code} — {testResult.message}</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        <Button className="w-full" onClick={() => revokeMutation.mutate(selected.id)} variant="destructive"><Trash /> Revogar integração</Button></CardContent></Card> : null}
    </TabsContent>
    <TabsContent value="meta"><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Meta Lead Ads</CardTitle><CardDescription>Conecte a conta administrativa para receber leads de campanhas.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4"><X className="text-amber-300" /><div><p className="text-sm font-medium">Não conectado</p><p className="mt-1 text-xs text-muted-foreground">A verificação da Meta Business ainda é uma dependência externa.</p></div><Button className="ml-auto" disabled variant="outline">Conectar em breve</Button></div></CardContent></Card></TabsContent>
    <CreateIntegrationDialog branches={branches} open={createOpen} onOpenChange={setCreateOpen} onSubmit={(formData) => createMutation.mutate(formData)} pending={createMutation.isPending} />
    <HelpIntegrationDialog open={helpOpen} onOpenChange={setHelpOpen} />
  </Tabs>;
}

function CreateIntegrationDialog({ branches, open, onOpenChange, onSubmit, pending }: { branches: Branch[]; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (formData: FormData) => void; pending: boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogPopup className="sm:max-w-md"><DialogTitle>Nova fonte de captura</DialogTitle><DialogDescription>Gere um token seguro vinculado à corretora e, opcionalmente, a uma filial.</DialogDescription><form action={onSubmit} className="grid gap-4"><Field><FieldLabel htmlFor="integration-name">Nome da fonte</FieldLabel><Input id="integration-name" name="name" placeholder="Meta Ads - Filial Centro" required /></Field><Field><FieldLabel>Origem padrão</FieldLabel><Select defaultValue="site_pixel" name="source" labels={{ site_pixel: "Pixel / Site", meta_ads: "Meta Lead Ads", landing_page: "Landing page" }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="site_pixel">Pixel / Site</SelectItem><SelectItem value="meta_ads">Meta Lead Ads</SelectItem><SelectItem value="landing_page">Landing page</SelectItem></SelectContent></Select></Field><Field><FieldLabel>Filial de destino</FieldLabel><Select name="branchId"><SelectTrigger className="w-full"><SelectValue placeholder="Primeira filial ativa" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></Field><div className="flex gap-2"><Button className="flex-1" disabled={pending} type="submit">{pending ? "Gerando token..." : "Gerar token"}</Button><DialogClose render={<Button disabled={pending} type="button" variant="ghost">Cancelar</Button>} /></div></form></DialogPopup></Dialog>;
}

function HelpIntegrationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle>Tutorial de Integração — Webhook de Leads</DialogTitle>
        <DialogDescription>
          Envie leads automaticamente do seu site ou landing page para o CorreTop.
        </DialogDescription>

        <div className="mt-4 space-y-5 text-xs leading-relaxed text-muted-foreground">
          {/* Passo 1 */}
          <div className="space-y-1.5">
            <h4 className="flex items-center gap-2 font-bold text-foreground">
              <span className="grid size-6 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] text-[10px] font-semibold text-primary">1</span>
              Inserir snippet de inicialização
            </h4>
            <p>Cole este snippet antes do {"</body>"} no seu HTML. Substitua <code>crt_live_SEU_TOKEN</code> pelo token copiado em Configurações:</p>
            <pre className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-5 text-foreground overflow-x-auto">
{`<script>
  window.CORRETOP_HUB_URL = "https://corretop.vercel.app/api/webhooks/leads";
  window.CORRETOP_HUB_TOKEN = "crt_live_SEU_TOKEN";
</script>`}
            </pre>
          </div>

          {/* Passo 2 */}
          <div className="space-y-1.5">
            <h4 className="flex items-center gap-2 font-bold text-foreground">
              <span className="grid size-6 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] text-[10px] font-semibold text-primary">2</span>
              Configurar envio no submit
            </h4>
            <p>Use Fetch API para enviar o payload no submit do formulário:</p>
            <pre className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-5 text-foreground overflow-x-auto">
{`document.getElementById("meuForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  const response = await fetch(window.CORRETOP_HUB_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.CORRETOP_HUB_TOKEN,
      "Idempotency-Key": "lead-" + Date.now()  // opcional
    },
    body: JSON.stringify({
      name: fd.get("name"),           // obrigatório
      phone: fd.get("phone"),         // obrigatório
      source: "landing-page",         // obrigatório
      email: fd.get("email"),         // opcional
      planInterest: "Plano X"         // opcional
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log("Lead criado:", result.data.leadId);
  } else {
    console.error("Erro:", result.error.code);
  }
});`}
            </pre>
          </div>

          {/* Passo 3 */}
          <div className="space-y-1.5">
            <h4 className="flex items-center gap-2 font-bold text-foreground">
              <span className="grid size-6 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] text-[10px] font-semibold text-primary">3</span>
              Testar com curl
            </h4>
            <pre className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-5 text-foreground overflow-x-auto">
{`curl -X POST \\
  "https://corretop.vercel.app/api/webhooks/leads" \\
  -H "Authorization: Bearer crt_live_SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Maria","phone":"+5521999999999","source":"landing-page"}'`}
            </pre>
          </div>

          {/* Campos */}
          <div className="rounded-xl border border-border p-4">
            <h4 className="mb-2 font-bold text-foreground">Campos do payload</h4>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Obrigatórios</p>
                <ul className="mt-1 space-y-0.5 text-foreground">
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">name</code> — Nome completo (2-160 chars)</li>
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">phone</code> — Telefone com DDD (mín. 10 dígitos)</li>
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">source</code> — Origem (ex: landing-page, meta-ads, indicacao)</li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Opcionais</p>
                <ul className="mt-1 space-y-0.5 text-foreground">
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">email</code> — E-mail do lead</li>
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">planInterest</code> — Plano de interesse</li>
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">externalId</code> — ID no seu sistema</li>
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">branchExternalId</code> — ID da filial de destino</li>
                  <li><code className="rounded bg-muted px-1 py-0.5 text-[11px]">metadata</code> — Objeto com até 20 chaves</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Respostas */}
          <div className="rounded-xl border border-border p-4">
            <h4 className="mb-2 font-bold text-foreground">Códigos de resposta</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground">
              <span><code className="rounded bg-emerald-500/10 px-1 py-0.5 text-[11px] text-emerald-600">201</code> Lead criado</span>
              <span><code className="rounded bg-emerald-500/10 px-1 py-0.5 text-[11px] text-emerald-600">200</code> Replay idempotente</span>
              <span><code className="rounded bg-amber-500/10 px-1 py-0.5 text-[11px] text-amber-600">401</code> Token inválido</span>
              <span><code className="rounded bg-amber-500/10 px-1 py-0.5 text-[11px] text-amber-600">422</code> Dados inválidos</span>
              <span><code className="rounded bg-amber-500/10 px-1 py-0.5 text-[11px] text-amber-600">409</code> Conflito idempotência</span>
              <span><code className="rounded bg-red-500/10 px-1 py-0.5 text-[11px] text-red-600">500</code> Erro interno</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button render={<Link href="/guia/webhook" />} size="sm" variant="ghost">
            Ver tutorial completo
          </Button>
          <DialogClose render={<Button type="button">Fechar</Button>} />
        </div>
      </DialogPopup>
    </Dialog>
  );
}
