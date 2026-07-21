"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitLeadFeedbackAction, type LeadFeedbackState } from "@/features/leads/feedback-actions";
import { getActiveChecklistTemplatesAction, type ChecklistTemplateWithItems } from "@/features/leads/checklist-actions";
import { CheckCircle, CircleDashed, ClipboardText } from "@/components/huge-icons";

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

export function InlineFeedbackForm({ leadId, onSuccess }: { leadId: string; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState<LeadFeedbackState, FormData>(submitLeadFeedbackAction, {});
  const [checklist, setChecklist] = useState<ChecklistTemplateWithItems | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [feedbackType, setFeedbackType] = useState("contacted");
  const [showChecklist, setShowChecklist] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Feedback registrado e SLA atualizado.");
      setSubmitted(true);
      onSuccess?.();
    }
    if (state.error) toast.error(state.error);
  }, [state.error, state.success, onSuccess]);

  useEffect(() => {
    getActiveChecklistTemplatesAction().then((templates) => {
      if (templates.length > 0) setChecklist(templates[0]);
    });
  }, []);

  const totalRequired = checklist ? checklist.items.filter((item) => item.required).length : 0;
  const answeredRequired = checklist
    ? checklist.items.filter((item) => {
        if (!item.required) return false;
        const val = answers[item.id];
        return val !== undefined && val !== "";
      }).length
    : 0;
  const allRequiredAnswered = showChecklist ? totalRequired === 0 || answeredRequired >= totalRequired : true;

  function handleSubmit(formData: FormData) {
    formData.set("leadId", leadId);
    formData.set("type", feedbackType);
    if (checklist && (showChecklist || Object.keys(answers).length > 0)) {
      formData.set("checklistId", checklist.id);
      formData.set("answers", JSON.stringify(answers));
    }
    action(formData);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-success/[0.06] px-4 py-3 text-sm">
        <CheckCircle className="size-5 text-success" />
        <div>
          <p className="font-medium text-success">Feedback registrado com sucesso!</p>
          <p className="text-xs text-muted-foreground">O SLA de atendimento foi atualizado.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input name="leadId" type="hidden" value={leadId} />

      {/* Quick fields row: type + next action */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs font-medium">O que aconteceu?</Label>
          <Select defaultValue="contacted" name="type" onValueChange={(value) => setFeedbackType(value ?? "contacted")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {feedbackTypes.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-medium" htmlFor="fi-next-action">Próxima ação</Label>
          <Input id="fi-next-action" name="nextAction" placeholder="Ex.: Retornar após análise" className="h-9 text-sm" />
        </div>
      </div>

      {/* Optional: observation */}
      <div className="grid gap-1.5">
        <Label className="text-xs font-medium" htmlFor="fi-content">Observação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
        <Input id="fi-content" name="content" placeholder="Contexto do contato..." className="h-9 text-sm" />
      </div>

      {/* Optional: date */}
      <div className="grid gap-1.5 sm:max-w-xs">
        <Label className="text-xs font-medium" htmlFor="fi-next-action-at">Data do próximo contato <span className="text-muted-foreground font-normal">(opcional)</span></Label>
        <Input id="fi-next-action-at" name="nextActionAt" type="datetime-local" className="h-9 text-sm" />
      </div>

      {/* Checklist toggle (post-submission widget) */}
      {checklist && (
        <>
          <button
            type="button"
            onClick={() => setShowChecklist(!showChecklist)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ClipboardText className="size-4" />
            {showChecklist ? "Ocultar checklist de qualidade" : `Checklist de qualidade (${answeredRequired}/${totalRequired})`}
          </button>

          <motion.div
            layout
            initial={false}
            animate={showChecklist ? "open" : "closed"}
            variants={{ open: { height: "auto", opacity: 1 }, closed: { height: 0, opacity: 0 } }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 rounded-lg border border-primary/10 bg-primary/[0.02] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{checklist.name}</p>
                <span className="text-[10px] text-muted-foreground">{answeredRequired}/{totalRequired} obrigatórias</span>
              </div>

              {totalRequired > 0 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min((answeredRequired / totalRequired) * 100, 100)}%` }}
                  />
                </div>
              )}

              <div className="space-y-3">
                {checklist.items.map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">
                        {item.question}
                        {item.required && <span className="ml-0.5 text-destructive">*</span>}
                      </Label>
                      {answers[item.id] !== undefined && (
                        <span className="text-[9px] text-success">✓</span>
                      )}
                    </div>

                    {item.answerType === "boolean" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: true }))}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            answers[item.id] === true
                              ? "border-success bg-success/10 text-success"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: false }))}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            answers[item.id] === false
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    )}

                    {item.answerType === "rating" && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: rating }))}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${
                              answers[item.id] === rating
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}

                    {item.answerType === "text" && (
                      <Input
                        value={String(answers[item.id] ?? "")}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Descreva..."
                        className="text-xs h-8"
                      />
                    )}

                    {item.answerType === "select" && Array.isArray(item.options) && (
                      <select
                        className="flex h-8 w-full rounded-lg border border-input bg-input/30 px-2.5 text-xs"
                        value={String(answers[item.id] ?? "")}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      >
                        <option value="">Selecione...</option>
                        {item.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-1">
        <Button disabled={pending || !allRequiredAnswered} size="sm" type="submit">
          {pending ? <><CircleDashed className="size-4 animate-spin" /> Salvando...</> : "Registrar feedback"}
        </Button>
        {showChecklist && !allRequiredAnswered && (
          <p className="text-[10px] text-muted-foreground">
            Responda todas as perguntas obrigatórias do checklist.
          </p>
        )}
      </div>
    </form>
  );
}
