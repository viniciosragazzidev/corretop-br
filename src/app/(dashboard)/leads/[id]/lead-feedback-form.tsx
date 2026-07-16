"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitLeadFeedbackAction, type LeadFeedbackState } from "@/features/leads/feedback-actions";

const feedbackTypes = [
  ["contacted", "Contato realizado"],
  ["no_answer", "Cliente não respondeu"],
  ["callback_requested", "Pediu retorno"],
  ["quote_sent", "Cotação enviada"],
  ["documentation_pending", "Documentação pendente"],
  ["negotiation", "Em negociação"],
  ["no_interest", "Sem interesse"],
  ["invalid_number", "Número inválido"],
  ["other", "Outro"],
] as const;

export function LeadFeedbackForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<LeadFeedbackState, FormData>(submitLeadFeedbackAction, {});
  useEffect(() => {
    if (state.success) toast.success("Feedback registrado e SLA atualizado.");
    if (state.error) toast.error(state.error);
  }, [state.error, state.success]);

  return <Card className="border-primary/20 bg-primary/[0.03] shadow-none">
    <CardHeader><CardTitle>Atualizar atendimento</CardTitle><CardDescription>Registre o andamento para manter o lead sob sua responsabilidade.</CardDescription></CardHeader>
    <CardContent><form action={action} className="grid gap-4 sm:grid-cols-2">
      <input name="leadId" type="hidden" value={leadId} />
      <div className="grid gap-2"><Label>O que aconteceu?</Label><Select defaultValue="contacted" name="type"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{feedbackTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2"><Label htmlFor="feedback-next-action">Próxima ação</Label><Input id="feedback-next-action" name="nextAction" placeholder="Ex.: Retornar após análise da proposta" /></div>
      <div className="grid gap-2 sm:col-span-2"><Label htmlFor="feedback-content">Observação</Label><Input id="feedback-content" name="content" placeholder="Contexto do contato (opcional)" /></div>
      <div className="grid gap-2"><Label htmlFor="feedback-next-action-at">Data do próximo contato</Label><Input id="feedback-next-action-at" name="nextActionAt" type="datetime-local" /></div>
      <div className="flex items-end"><Button disabled={pending} type="submit">{pending ? "Salvando..." : "Registrar feedback"}</Button></div>
    </form></CardContent>
  </Card>;
}
