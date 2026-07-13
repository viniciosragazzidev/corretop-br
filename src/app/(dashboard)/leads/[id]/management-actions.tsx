"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assumeLeadForInvestigationAction, reassignLeadAction, type ManagementActionState } from "@/features/leads/management-actions";

type Broker = { id: string; name: string };
export function LeadManagementActions({ leadId, brokers, canManage, isLost, currentStatus, currentOwner }: { leadId: string; brokers: Broker[]; canManage: boolean; isLost: boolean; currentStatus: string; currentOwner: string | null }) {
  const router = useRouter();
  const [brokerId, setBrokerId] = useState("");
  const [reason, setReason] = useState("");
  const [reassignState, reassign, reassignPending] = useActionState<ManagementActionState, FormData>(reassignLeadAction, {});
  const [assumeState, assume, assumePending] = useActionState<ManagementActionState, FormData>(assumeLeadForInvestigationAction, {});
  useEffect(() => { if (reassignState.success) { toast.success("Lead reatribuído e SLA reiniciado."); router.refresh(); } if (reassignState.error) toast.error(reassignState.error); }, [reassignState, router]);
  useEffect(() => { if (assumeState.success) { toast.success("Lead assumido para investigação."); router.refresh(); } if (assumeState.error) toast.error(assumeState.error); }, [assumeState, router]);
  if (!canManage) return null;
  const locked = ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(currentStatus);
  return <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Ações de gestão</CardTitle><CardDescription>{locked ? `Atendimento ativo por ${currentOwner ?? "outro responsável"}. Ações de gestão ficam bloqueadas para evitar conflito.` : "Reatribua a operação ou registre uma investigação excepcional."}</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2"><form action={reassign} className="grid gap-2"><Label>Reatribuir para corretor</Label><input name="leadId" type="hidden" value={leadId} /><Select disabled={locked} name="brokerId" onValueChange={(value) => setBrokerId(value ?? "")} value={brokerId}><SelectTrigger><SelectValue placeholder="Selecione um corretor" /></SelectTrigger><SelectContent>{brokers.map((broker) => <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>)}</SelectContent></Select><Button disabled={!brokerId || reassignPending || locked} type="submit" variant="outline">{reassignPending ? "Reatribuindo..." : "Reatribuir e reiniciar SLA"}</Button></form><form action={assume} className="grid gap-2"><Label>Assumir para investigação</Label><input name="leadId" type="hidden" value={leadId} /><Input disabled={locked} name="reason" onChange={(event) => setReason(event.target.value)} placeholder="Motivo da investigação" value={reason} /><Button disabled={reason.trim().length < 3 || assumePending || isLost || locked} type="submit" variant="secondary">{assumePending ? "Registrando..." : "Assumir para mim"}</Button>{isLost ? <p className="text-xs text-muted-foreground">Reabra o lead antes de assumir para investigação.</p> : null}</form></CardContent></Card>;
}
