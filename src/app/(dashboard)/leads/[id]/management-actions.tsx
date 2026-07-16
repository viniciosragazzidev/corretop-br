"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ArrowRight, UserPlus } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assumeLeadForInvestigationAction, reassignLeadAction, type ManagementActionState } from "@/features/leads/management-actions";

type Broker = { id: string; name: string };
type ManagementMode = "reassign" | "investigate";

export function LeadManagementActions({ leadId, brokers, canManage, isLost, currentStatus, currentOwner }: { leadId: string; brokers: Broker[]; canManage: boolean; isLost: boolean; currentStatus: string; currentOwner: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<ManagementMode>("reassign");
  const [brokerId, setBrokerId] = useState("");
  const [reason, setReason] = useState("");
  const [reassignState, reassign, reassignPending] = useActionState<ManagementActionState, FormData>(reassignLeadAction, {});
  const [assumeState, assume, assumePending] = useActionState<ManagementActionState, FormData>(assumeLeadForInvestigationAction, {});

  useEffect(() => {
    if (reassignState.success) {
      toast.success("Lead reatribuído e SLA reiniciado.");
      router.refresh();
    }
    if (reassignState.error) toast.error(reassignState.error);
  }, [reassignState, router]);

  useEffect(() => {
    if (assumeState.success) {
      toast.success("Lead assumido para investigação.");
      router.refresh();
    }
    if (assumeState.error) toast.error(assumeState.error);
  }, [assumeState, router]);

  if (!canManage) return null;

  const locked = ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(currentStatus);
  const selectedModeDescription = mode === "reassign"
    ? "Transfira a responsabilidade para outro corretor elegível. O SLA de primeiro contato será reiniciado."
    : "Assuma este caso para apurar uma exceção. Registre o motivo para manter a operação auditável.";

  return (
    <Card className="border-border/80 bg-card shadow-none">
      <CardHeader className="gap-1 border-b border-border/60 pb-3">
        <div className="flex items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><UserPlus className="size-4" /></span>
          <div>
            <CardTitle className="text-sm">Gestão do lead</CardTitle>
            <CardDescription className="mt-0.5 text-xs">Use apenas quando precisar intervir na distribuição ou no atendimento.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {locked ? (
          <p className="rounded-lg border border-warning/20 bg-warning/[0.04] px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            Atendimento ativo por <strong className="font-medium text-foreground">{currentOwner ?? "outro responsável"}</strong>. A gestão está bloqueada para evitar conflito.
          </p>
        ) : (
          <>
            <div className="inline-flex w-full rounded-lg border border-border/80 bg-muted/50 p-1" role="group" aria-label="Tipo de intervenção">
              <Button className="h-8 flex-1 text-xs" onClick={() => setMode("reassign")} size="sm" type="button" variant={mode === "reassign" ? "secondary" : "ghost"}>Reatribuir</Button>
              <Button className="h-8 flex-1 text-xs" onClick={() => setMode("investigate")} size="sm" type="button" variant={mode === "investigate" ? "secondary" : "ghost"}>Investigar</Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{selectedModeDescription}</p>

            {mode === "reassign" ? (
              <form action={reassign} className="space-y-3">
                <input name="leadId" type="hidden" value={leadId} />
                <div className="space-y-1.5">
                  <Label htmlFor="lead-reassign-broker">Novo responsável</Label>
                  <Select name="brokerId" onValueChange={(value) => setBrokerId(value ?? "")} value={brokerId}>
                    <SelectTrigger id="lead-reassign-broker"><SelectValue placeholder="Selecione um corretor" /></SelectTrigger>
                    <SelectContent>{brokers.map((broker) => <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full justify-between" disabled={!brokerId || reassignPending} type="submit" variant="outline">
                  {reassignPending ? "Reatribuindo..." : "Confirmar reatribuição"}<ArrowRight className="size-4" />
                </Button>
              </form>
            ) : (
              <form action={assume} className="space-y-3">
                <input name="leadId" type="hidden" value={leadId} />
                <div className="space-y-1.5">
                  <Label htmlFor="lead-investigation-reason">Motivo da investigação</Label>
                  <Input id="lead-investigation-reason" name="reason" onChange={(event) => setReason(event.target.value)} placeholder="Ex.: divergência na distribuição" value={reason} />
                </div>
                {isLost ? <p className="text-xs text-muted-foreground">Reabra o lead antes de assumir a investigação.</p> : null}
                <Button className="w-full justify-between" disabled={reason.trim().length < 3 || assumePending || isLost} type="submit" variant="secondary">
                  {assumePending ? "Registrando..." : "Assumir investigação"}<ArrowRight className="size-4" />
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
