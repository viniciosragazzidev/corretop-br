"use client";

import { useState } from "react";
import { Plus } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ManualLeadForm } from "./manual-lead-form";

type PlanOption = { id: string; name: string; carrierName: string };

export function ManualLeadSheet({ plans, initiallyOpen = false }: { plans: PlanOption[]; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <Sheet onOpenChange={setOpen} open={open}><SheetTrigger render={<Button><Plus weight="bold" /> Novo lead</Button>} /><SheetContent className="w-full sm:max-w-lg"><SheetHeader><SheetTitle>Novo lead</SheetTitle><SheetDescription>Cadastre uma indicação ou contato recebido fora de uma campanha.</SheetDescription></SheetHeader><div className="overflow-y-auto px-4 pb-6"><ManualLeadForm plans={plans} /></div></SheetContent></Sheet>;
}
