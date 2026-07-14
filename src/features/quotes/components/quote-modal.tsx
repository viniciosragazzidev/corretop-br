"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Calculator, CheckCircle, Users, FileText } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogPopup,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createQuoteAction } from "@/features/quotes/actions";

type Plan = {
  id: string;
  name: string;
  carrierName: string;
  coverage: string | null;
};

const ageBands = [
  "0 a 18",
  "19 a 23",
  "24 a 28",
  "29 a 33",
  "34 a 38",
  "39 a 43",
  "44 a 48",
  "49 a 53",
  "54 a 58",
  "59+"
];

export function QuoteModal({
  leadId,
  plans,
  open,
  onOpenChange,
}: {
  leadId: string;
  plans: Plan[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [lives, setLives] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  const totalLives = Object.values(lives).reduce((total, quantity) => total + quantity, 0);

  useEffect(() => {
    if (!open) {
      setSelectedPlans([]);
      setLives({});
      setNotes("");
    }
  }, [open]);

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
        lives: ageBands.map((ageBand) => ({
          ageBand,
          quantity: lives[ageBand] ?? 0,
        })),
        notes: notes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Cotação criada com sucesso!");
      onOpenChange(false);
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" />
            Nova Cotação
          </DialogTitle>
          <DialogDescription>
            Gere uma proposta de planos de saúde/odontológicos vinculada a este lead.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Users className="size-4 text-primary" />
                Informe as vidas por faixa etária
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                {ageBands.map((ageBand) => (
                  <div key={ageBand} className="space-y-1">
                    <Label className="text-xs" htmlFor={`age-${ageBand}`}>
                      {ageBand}
                    </Label>
                    <Input
                      id={`age-${ageBand}`}
                      type="number"
                      min="0"
                      className="h-8 text-xs"
                      value={lives[ageBand] ?? 0}
                      onChange={(event) =>
                        setLives((current) => ({
                          ...current,
                          [ageBand]: Math.max(0, Number(event.target.value) || 0),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm">
                <FileText className="size-4 text-primary" />
                Selecione os planos para comparison
              </div>
              <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {plans.length ? (
                  plans.map((plan) => (
                    <label
                      key={plan.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs transition-colors hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedPlans.includes(plan.id)}
                        onCheckedChange={() => togglePlan(plan.id)}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{plan.name}</span>
                        <span className="mt-0.5 block text-muted-foreground truncate">
                          {plan.carrierName}
                          {plan.coverage ? ` · ${plan.coverage}` : ""}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="col-span-2 text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                    Não há planos ativos cadastrados.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="quote-notes">Observações da Cotação (Opcional)</Label>
              <textarea
                id="quote-notes"
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="Ex.: Desconto na taxa de adesão, coparticipação padrão, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 h-fit space-y-4">
            <h4 className="font-semibold text-sm">Resumo</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total de vidas:</span>
                <span className="font-medium">{totalLives}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Planos selecionados:</span>
                <span className="font-medium">{selectedPlans.length}</span>
              </div>
            </div>

            <Button
              className="w-full text-xs"
              disabled={!selectedPlans.length || !totalLives || pending}
              onClick={createQuote}
            >
              {pending ? "Criando..." : <><CheckCircle className="size-4" /> Criar cotação</>}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
