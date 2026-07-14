"use client";

import { useState } from "react";
import { Calculator } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { QuoteModal } from "@/features/quotes/components/quote-modal";

type Plan = {
  id: string;
  name: string;
  carrierName: string;
  coverage: string | null;
};

export function QuoteModalButton({ leadId, plans }: { leadId: string; plans: Plan[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Calculator className="size-4" /> Cotar
      </Button>
      <QuoteModal leadId={leadId} plans={plans} open={open} onOpenChange={setOpen} />
    </>
  );
}
