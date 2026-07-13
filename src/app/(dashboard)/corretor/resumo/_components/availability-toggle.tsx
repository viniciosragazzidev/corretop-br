"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleBrokerAvailabilityAction } from "@/features/leads/availability-action";

export function AvailabilityToggle({ initialStatus }: { initialStatus: "available" | "paused" }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  function toggle() {
    startTransition(async () => {
      try { await toggleBrokerAvailabilityAction(); setStatus(status === "available" ? "paused" : "available"); toast.success(status === "available" ? "Você foi pausado para novos leads." : "Você voltou a receber leads."); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a disponibilidade."); }
    });
  }
  return <Button disabled={pending} onClick={toggle} size="sm" variant="outline">{pending ? "Atualizando..." : status === "available" ? "Disponível para leads" : "Pausado para novos leads"}</Button>;
}
