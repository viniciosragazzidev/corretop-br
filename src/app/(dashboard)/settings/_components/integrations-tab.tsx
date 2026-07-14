"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, LinkSimple, Plus, ShieldCheck, Trash, WifiHigh, X } from "@/components/huge-icons";
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
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border"><div><CardTitle>Fontes de captura</CardTitle><CardDescription>Tokens que recebem leads e os encaminham para uma filial.</CardDescription></div><Button onClick={() => setCreateOpen(true)} size="sm"><Plus /> Nova fonte</Button></CardHeader>
        <CardContent className="p-0"><div className="divide-y divide-border">
          {data.integrations.map((item) => <button className={`grid w-full grid-cols-[1fr_auto] gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${selected?.id === item.id ? "bg-muted/30" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium">{item.name}</span>{item.id.startsWith("temp-") ? <Badge variant="secondary">Sincronizando</Badge> : null}</span><span className="mt-1 block text-xs text-muted-foreground">{sourceLabel[item.source] ?? item.source} · {item.branchName ?? "Primeira filial ativa"}</span></span><span className="flex items-center gap-3"><span className={`size-2 rounded-full ${item.status === "active" ? "bg-emerald-400" : "bg-muted-foreground"}`} /><span className="text-xs text-muted-foreground">{item.status === "active" ? "Ativo" : "Inativo"}</span></span></button>)}
          {!data.integrations.length ? <div className="p-10 text-center"><ShieldCheck className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Nenhuma fonte configurada</p><p className="mt-1 text-xs text-muted-foreground">Crie um token para começar a receber leads automaticamente.</p></div> : null}
        </div></CardContent>
      </Card>
      {selected ? <Card className="h-fit border-border bg-card shadow-none"><CardHeader><CardTitle className="text-base">Configuração da fonte</CardTitle><CardDescription>{selected.name}</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="grid gap-1"><span className="text-xs text-muted-foreground">Token</span><code className="rounded-md bg-muted px-2.5 py-2 text-xs">{selected.tokenPrefix}⬢⬢⬢⬢⬢⬢⬢⬢</code><span className="text-[11px] text-muted-foreground">O token completo só é exibido uma vez após a criação.</span></div><div className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="text-sm font-medium">Recebimento</p><p className="text-xs text-muted-foreground">{selected.status === "active" ? "Aceitando novos leads" : "Bloqueado"}</p></div><Button aria-label="Alternar status" onClick={() => toggleMutation.mutate(selected.id)} size="sm" variant="outline">{selected.status === "active" ? "Desativar" : "Ativar"}</Button></div><div className="grid gap-2"><div className="flex items-center justify-between"><span className="text-xs font-medium">Snippet do hub</span><Button onClick={copySnippet} size="sm" variant="ghost">{copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}</Button></div><pre className="max-h-44 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-5 text-muted-foreground">{snippet}</pre></div><Button className="w-full" onClick={() => revokeMutation.mutate(selected.id)} variant="destructive"><Trash /> Revogar integração</Button></CardContent></Card> : null}
    </TabsContent>
    <TabsContent value="meta"><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Meta Lead Ads</CardTitle><CardDescription>Conecte a conta administrativa para receber leads de campanhas.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4"><X className="text-amber-300" /><div><p className="text-sm font-medium">Não conectado</p><p className="mt-1 text-xs text-muted-foreground">A verificação da Meta Business ainda é uma dependência externa.</p></div><Button className="ml-auto" disabled variant="outline">Conectar em breve</Button></div></CardContent></Card></TabsContent>
    <CreateIntegrationDialog branches={branches} open={createOpen} onOpenChange={setCreateOpen} onSubmit={(formData) => createMutation.mutate(formData)} pending={createMutation.isPending} />
  </Tabs>;
}

function CreateIntegrationDialog({ branches, open, onOpenChange, onSubmit, pending }: { branches: Branch[]; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (formData: FormData) => void; pending: boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogPopup className="sm:max-w-md"><DialogTitle>Nova fonte de captura</DialogTitle><DialogDescription>Gere um token seguro vinculado à corretora e, opcionalmente, a uma filial.</DialogDescription><form action={onSubmit} className="grid gap-4"><Field><FieldLabel htmlFor="integration-name">Nome da fonte</FieldLabel><Input id="integration-name" name="name" placeholder="Meta Ads - Filial Centro" required /></Field><Field><FieldLabel>Origem padrão</FieldLabel><Select defaultValue="site_pixel" name="source"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="site_pixel">Pixel / Site</SelectItem><SelectItem value="meta_ads">Meta Lead Ads</SelectItem><SelectItem value="landing_page">Landing page</SelectItem></SelectContent></Select></Field><Field><FieldLabel>Filial de destino</FieldLabel><Select name="branchId"><SelectTrigger className="w-full"><SelectValue placeholder="Primeira filial ativa" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></Field><div className="flex gap-2"><Button className="flex-1" disabled={pending} type="submit">{pending ? "Gerando token..." : "Gerar token"}</Button><DialogClose render={<Button disabled={pending} type="button" variant="ghost">Cancelar</Button>} /></div></form></DialogPopup></Dialog>;
}
