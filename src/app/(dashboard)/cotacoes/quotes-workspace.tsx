"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Calculator, CheckCircle, FileText, Users } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createQuoteAction } from "@/features/quotes/actions";

type Lead = { id: string; nome: string; status: string };
type Plan = { id: string; name: string; carrierName: string; coverage: string | null };
const ageBands = ["0 a 18", "19 a 23", "24 a 28", "29 a 33", "34 a 38", "39 a 43", "44 a 48", "49 a 53", "54 a 58", "59+"];

function CardHeading({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) { return <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div></div>; }

export function QuotesWorkspace({ leads, plans }: { leads: Lead[]; plans: Plan[] }) {
  const router = useRouter(); const searchParams = useSearchParams(); const [pending, startTransition] = useTransition();
  const [leadId, setLeadId] = useState(() => { const id = searchParams.get("leadId"); return leads.some((lead) => lead.id === id) ? id! : leads[0]?.id ?? ""; });
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]); const [lives, setLives] = useState<Record<string, number>>({});
  const totalLives = Object.values(lives).reduce((total, quantity) => total + quantity, 0); const currentLead = leads.find((lead) => lead.id === leadId);
  function togglePlan(id: string) { setSelectedPlans((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function createQuote() { startTransition(async () => { const result = await createQuoteAction({ leadId, planIds: selectedPlans, lives: ageBands.map((ageBand) => ({ ageBand, quantity: lives[ageBand] ?? 0 })) }); if (result.error) { toast.error(result.error); return; } toast.success("Cotação criada. Revise os detalhes antes de compartilhar."); router.push(`/cotacoes/${result.quoteId}`); }); }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-6"><Card className="border-border bg-card shadow-none"><CardHeader><CardHeading description="Defina as faixas etárias para calcular os preços cadastrados no catálogo." icon={Users} title="Informe as vidas" /></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{ageBands.map((ageBand) => <div key={ageBand} className="space-y-1.5"><Label htmlFor={`age-${ageBand}`}>{ageBand}</Label><Input id={`age-${ageBand}`} min="0" onChange={(event) => setLives((current) => ({ ...current, [ageBand]: Math.max(0, Number(event.target.value) || 0) }))} type="number" value={lives[ageBand] ?? 0} /></div>)}</CardContent></Card><Card className="border-border bg-card shadow-none"><CardHeader><CardHeading description="Selecione produtos com preço cadastrado para as faixas escolhidas." icon={FileText} title="Planos disponíveis" /></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{plans.length ? plans.map((plan) => <label key={plan.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors duration-150 hover:bg-muted/40"><Checkbox checked={selectedPlans.includes(plan.id)} onCheckedChange={() => togglePlan(plan.id)} /><span className="min-w-0"><span className="block font-medium">{plan.name}</span><span className="mt-1 block text-sm text-muted-foreground">{plan.carrierName}{plan.coverage ? ` · ${plan.coverage}` : ""}</span></span></label>) : <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">Não há planos ativos no catálogo.</p>}</CardContent></Card></div><Card className="h-fit border-border bg-card shadow-none xl:sticky xl:top-20"><CardHeader><CardHeading description="Revise o cliente e a seleção antes de criar." icon={Calculator} title="Resumo da cotação" /></CardHeader><CardContent className="space-y-4"><div className="space-y-1.5"><Label>Lead</Label><Select value={leadId} onValueChange={(value) => setLeadId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Selecione um lead" /></SelectTrigger><SelectContent>{leads.map((lead) => <SelectItem key={lead.id} value={lead.id}>{lead.nome}</SelectItem>)}</SelectContent></Select></div><div className="rounded-lg border border-border bg-muted/30 p-3 text-sm"><p className="text-muted-foreground">Cliente selecionado</p><p className="mt-1 font-medium">{currentLead?.nome ?? "Nenhum lead selecionado"}</p><div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3"><div><p className="text-xs text-muted-foreground">Vidas</p><p className="mt-1 text-xl font-semibold tabular-nums">{totalLives}</p></div><div><p className="text-xs text-muted-foreground">Planos</p><p className="mt-1 text-xl font-semibold tabular-nums">{selectedPlans.length}</p></div></div></div><Button className="w-full" disabled={!leadId || !selectedPlans.length || !totalLives || pending} onClick={createQuote}>{pending ? "Criando..." : <><CheckCircle /> Criar cotação</>}</Button></CardContent></Card></div>;
}
