"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileText, LinkSimple } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shareQuoteAction } from "@/features/quotes/actions";

type Quote = {
  id: string;
  status: string;
  publicToken: string;
  createdAt: Date;
  totalPrice: string | null;
  plansCount: number;
};

export function LeadQuotesSection({
  quotes,
}: {
  quotes: Quote[];
}) {
  const [pending, startTransition] = useTransition();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      case "shared":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" variant="outline">Compartilhada</Badge>;
      case "sent":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" variant="outline">Enviada</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" variant="outline">Aceita</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleShare = (quoteId: string) => {
    startTransition(async () => {
      const result = await shareQuoteAction(quoteId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cotação preparada para compartilhamento!");
      window.location.reload();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">Cotações Geradas</h3>
      </div>

      {quotes.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 border border-dashed rounded-lg text-center">
          Nenhuma cotação gerada para este lead ainda.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="flex items-center justify-between rounded-lg border p-4 bg-card text-xs hover:bg-muted/10 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">R$ {quote.totalPrice || "0.00"}</span>
                  {getStatusBadge(quote.status)}
                </div>
                <div className="text-muted-foreground">
                  {quote.plansCount} plano(s) · {new Intl.DateTimeFormat("pt-BR").format(new Date(quote.createdAt))}
                </div>
              </div>

              <div className="flex gap-1.5">
                <Button
                  size="icon-xs"
                  variant="outline"
                  title="Compartilhar link público"
                  disabled={pending}
                  onClick={() => handleShare(quote.id)}
                >
                  <LinkSimple className="size-3.5" />
                </Button>
                <a
                  href={`/proposta/${quote.publicToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-6 items-center justify-center rounded-[min(var(--radius-md),10px)] border border-border bg-background hover:bg-muted"
                  title="Visualizar PDF"
                >
                  <FileText className="size-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
