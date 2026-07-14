"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Copy, LinkSimple, PaperPlaneTilt } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { shareQuoteAction } from "@/features/quotes/actions";

export function QuoteShareActions({ quoteId, publicToken, customerName, phone, quoteText }: { quoteId: string; publicToken: string; customerName: string; phone: string | null; quoteText: string }) {
  const [pending, startTransition] = useTransition();
  const publicLink = typeof window === "undefined" ? `/proposta/${publicToken}` : `${window.location.origin}/proposta/${publicToken}`;

  function prepareShare(callback: () => void) {
    startTransition(async () => {
      const result = await shareQuoteAction(quoteId);
      if (result.error) { toast.error(result.error); return; }
      callback();
    });
  }

  return <div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={() => prepareShare(() => { navigator.clipboard.writeText(quoteText); toast.success("Texto da cotação copiado."); })} variant="outline"><Copy /> Copiar texto</Button><Button disabled={pending} onClick={() => prepareShare(() => { navigator.clipboard.writeText(publicLink); toast.success("Link público copiado."); })} variant="outline"><LinkSimple /> Copiar link</Button><Button disabled={pending || !phone} onClick={() => prepareShare(() => { window.open(`https://wa.me/${phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`${quoteText}\n\n${publicLink}`)}`, "_blank", "noopener,noreferrer"); })}><PaperPlaneTilt /> {pending ? "Preparando..." : `Enviar para ${customerName}`}</Button></div>;
}
