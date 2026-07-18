"use client";

import { Calculator } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";

export function CotarButton() {
  return (
    <Button render={<a href="https://cotadorsimplificado.com.br/" rel="noreferrer" target="_blank" />} size="sm">
      <Calculator className="size-4" /> Cotar
    </Button>
  );
}
