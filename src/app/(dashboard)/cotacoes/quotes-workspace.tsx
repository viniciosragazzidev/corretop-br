"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  Calculator,
  CheckCircle,
  FileText,
  Users,
  SlidersHorizontal,
} from "@/components/huge-icons";
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

function CardHeading({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        <CardDescription className="text-[11px] text-muted-foreground">{description}</CardDescription>
      </div>
    </div>
  );
}

export function QuotesWorkspace({ leads, plans }: { leads: Lead[]; plans: Plan[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Selections & Simulator Parameters
  const [tableType, setTableType] = useState<"individual" | "familiar" | "adesao" | "pme">("individual");
  const [planType, setPlanType] = useState<"saude" | "odonto">("saude");
  const [region, setRegion] = useState("Rio de Janeiro");
  const [copart, setCopart] = useState<"todos" | "sem_copart" | "com_copart">("todos");
  const [coverageFilter, setCoverageFilter] = useState("todos");

  const [leadId, setLeadId] = useState(() => {
    const id = searchParams.get("leadId");
    return leads.some((lead) => lead.id === id) ? id! : leads[0]?.id ?? "";
  });
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [lives, setLives] = useState<Record<string, number>>({});

  const totalLives = Object.values(lives).reduce((total, quantity) => total + quantity, 0);
  const currentLead = leads.find((lead) => lead.id === leadId);

  // Group plans by operator/carrier
  const groupedPlans = plans.reduce<Record<string, Plan[]>>((acc, plan) => {
    if (!acc[plan.carrierName]) acc[plan.carrierName] = [];
    acc[plan.carrierName].push(plan);
    return acc;
  }, {});

  function togglePlan(id: string) {
    setSelectedPlans((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function createQuote() {
    startTransition(async () => {
      const result = await createQuoteAction({
        leadId,
        planIds: selectedPlans,
        lives: ageBands.map((ageBand) => ({ ageBand, quantity: lives[ageBand] ?? 0 })),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cotação criada com sucesso.");
      router.push(`/cotacoes/${result.quoteId}`);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] bg-background/50 p-1">
      <div className="space-y-6">

        {/* Step 1: Simulator Parametrization */}
        <Card className="border border-border/80 bg-card shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardHeading
              description="Configure os filtros e parâmetros base para filtrar os planos disponíveis do catálogo."
              icon={SlidersHorizontal}
              title="1. Parametros do Simulador"
            />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo de Tabela</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                value={tableType}
                onChange={(e) => setTableType(e.target.value as any)}
              >
                <option value="individual">Individual</option>
                <option value="familiar">Familiar</option>
                <option value="adesao">Coletivo por Adesão</option>
                <option value="pme">PME/Empresarial</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo de Plano</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                value={planType}
                onChange={(e) => setPlanType(e.target.value as any)}
              >
                <option value="saude">Saúde / Médico</option>
                <option value="odonto">Odontológico</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Região / Praça</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="Rio de Janeiro">Rio de Janeiro</option>
                <option value="São Paulo">São Paulo</option>
                <option value="Minas Gerais">Minas Gerais</option>
                <option value="Bahia">Bahia</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Coparticipação</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                value={copart}
                onChange={(e) => setCopart(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="sem_copart">Sem Coparticipação</option>
                <option value="com_copart">Com Coparticipação</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Lives Count */}
        <Card className="border border-border/80 bg-card shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardHeading
              description="Defina a quantidade de beneficiários em cada faixa etária para precificação."
              icon={Users}
              title="2. Distribuição de Vidas"
            />
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-5 pt-5">
            {ageBands.map((ageBand) => (
              <div key={ageBand} className="space-y-1">
                <Label htmlFor={`age-${ageBand}`} className="text-[10px] text-muted-foreground uppercase font-bold">
                  {ageBand} anos
                </Label>
                <Input
                  id={`age-${ageBand}`}
                  min="0"
                  onChange={(event) =>
                    setLives((current) => ({
                      ...current,
                      [ageBand]: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                  type="number"
                  className="h-9 text-xs font-semibold tabular-nums"
                  value={lives[ageBand] ?? 0}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Step 3: Operadoras e Planos */}
        <Card className="border border-border/80 bg-card shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardHeading
              description="Selecione quais planos comparar e cotar na proposta final."
              icon={FileText}
              title="3. Seleção de Operadoras e Planos"
            />
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {Object.keys(groupedPlans).length > 0 ? (
              Object.entries(groupedPlans).map(([carrier, carrierPlans]) => (
                <div key={carrier} className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-1.5">
                    <span className="grid size-6 place-items-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {carrier.charAt(0)}
                    </span>
                    <h3 className="text-xs font-bold text-foreground/80 tracking-wide uppercase">{carrier}</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {carrierPlans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all duration-150 ${
                          selectedPlans.includes(plan.id)
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/80 hover:bg-muted/30"
                        }`}
                      >
                        <Checkbox
                          checked={selectedPlans.includes(plan.id)}
                          onCheckedChange={() => togglePlan(plan.id)}
                        />
                        <div className="min-w-0 -mt-0.5">
                          <span className="block text-xs font-semibold text-foreground">{plan.name}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground font-medium">
                            {plan.coverage || "Abrangência não informada"}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                Nenhum plano cadastrado no catálogo comercial.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary side-panel */}
      <Card className="h-fit border border-border/80 bg-card shadow-none xl:sticky xl:top-20">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardHeading
            description="Revise o cliente e a seleção antes de gerar o PDF."
            icon={Calculator}
            title="Resumo da Cotação"
          />
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Lead de Destino</Label>
            <Select value={leadId} onValueChange={(value) => setLeadId(value ?? "")}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Selecione um lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id} className="text-xs">
                    {lead.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3.5 text-xs space-y-2.5">
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Cliente selecionado</p>
              <p className="mt-0.5 text-xs font-bold text-foreground">{currentLead?.nome ?? "Nenhum lead selecionado"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-2.5">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total Vidas</p>
                <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">{totalLives}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Planos Coti.</p>
                <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">{selectedPlans.length}</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-9 font-semibold text-xs gap-1.5 mt-2"
            disabled={!leadId || !selectedPlans.length || !totalLives || pending}
            onClick={createQuote}
          >
            {pending ? "Processando..." : <><CheckCircle className="size-4" /> Criar cotação</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
