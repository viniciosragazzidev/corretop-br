"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogDescription, DialogPanel, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { registerSaleAction } from "@/features/post-sale/actions";

type CarrierOption = { id: string; name: string };
type ConfirmationDocument = { id: string; filename: string; status: string };

export function RegisterSalePanel({
  leadId,
  documents,
  carriers,
  open,
  onOpenChange,
}: {
  leadId: string;
  documents: ConfirmationDocument[];
  carriers: CarrierOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverageStartDate, setCoverageStartDate] = useState("");
  const [approvedValue, setApprovedValue] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [confirmationDocumentId, setConfirmationDocumentId] = useState("");
  const approvedDocuments = documents.filter((document) => document.status === "approved");

  function submit() {
    startTransition(async () => {
      const result = await registerSaleAction({
        leadId,
        policyNumber,
        coverageStartDate,
        approvedValue,
        confirmationDocumentId,
        carrierId: carrierId || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Venda registrada e cliente ativo criado.");
      onOpenChange(false);
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[min(90vh,44rem)] overflow-y-auto">
        <DialogPanel>
          <div className="space-y-1">
            <DialogTitle>Confirmar venda e converter lead</DialogTitle>
            <DialogDescription>
              Preencha os dados confirmados pela operadora. O lead só será convertido depois da validação completa.
            </DialogDescription>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {carriers.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="sale-carrier">Operadora</Label>
                <select id="sale-carrier" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={carrierId} onChange={(event) => setCarrierId(event.target.value)}>
                  <option value="">Selecione a operadora...</option>
                  {carriers.map((carrier) => <option key={carrier.id} value={carrier.id}>{carrier.name}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5"><Label htmlFor="policy-number">Número da apólice</Label><Input id="policy-number" value={policyNumber} onChange={(event) => setPolicyNumber(event.target.value)} placeholder="Ex.: 123456789" /></div>
            <div className="space-y-1.5"><Label htmlFor="coverage-start-date">Início da vigência</Label><Input id="coverage-start-date" type="date" value={coverageStartDate} onChange={(event) => setCoverageStartDate(event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="approved-value">Valor final aprovado</Label><Input id="approved-value" min="0" step="0.01" type="number" value={approvedValue} onChange={(event) => setApprovedValue(event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="confirmation-document">Confirmação aprovada da operadora</Label><select id="confirmation-document" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={confirmationDocumentId} onChange={(event) => setConfirmationDocumentId(event.target.value)}><option value="">Selecione um documento</option>{approvedDocuments.map((document) => <option key={document.id} value={document.id}>{document.filename}</option>)}</select></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" disabled={pending || !policyNumber || !coverageStartDate || !approvedValue || !confirmationDocumentId} onClick={submit}>{pending ? "Validando..." : "Confirmar venda"}</Button>
            </div>
          </div>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
