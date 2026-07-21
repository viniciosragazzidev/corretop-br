"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSaleAction } from "@/features/post-sale/actions";

type CarrierOption = { id: string; name: string };
type ConfirmationDocument = { id: string; filename: string; status: string };

export function RegisterSalePanel({ leadId, documents, carriers }: { leadId: string; documents: ConfirmationDocument[]; carriers: CarrierOption[] }) {
  const [pending, startTransition] = useTransition();
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverageStartDate, setCoverageStartDate] = useState("");
  const [approvedValue, setApprovedValue] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [confirmationDocumentId, setConfirmationDocumentId] = useState("");
  const approvedDocuments = documents.filter((document) => document.status === "approved");

  function submit() {
    startTransition(async () => {
      const result = await registerSaleAction({ leadId, policyNumber, coverageStartDate, approvedValue, confirmationDocumentId, carrierId: carrierId || undefined });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Venda registrada e cliente ativo criado.");
      window.location.reload();
    });
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.03] shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Registrar venda</CardTitle>
        <CardDescription>Informe os dados confirmados pela operadora. O sistema só libera a conversão quando o checklist estiver aprovado.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {/* Carrier select — first field for context */}
        {carriers.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="sale-carrier">Operadora</Label>
            <select
              id="sale-carrier"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={carrierId}
              onChange={(event) => setCarrierId(event.target.value)}
            >
              <option value="">{carriers.length > 0 ? "Selecione a operadora..." : "Nenhuma operadora disponível"}</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5"><Label htmlFor="policy-number">Número da apólice</Label><Input id="policy-number" value={policyNumber} onChange={(event) => setPolicyNumber(event.target.value)} placeholder="Ex.: 123456789" /></div>
        <div className="space-y-1.5"><Label htmlFor="coverage-start-date">Início da vigência</Label><Input id="coverage-start-date" type="date" value={coverageStartDate} onChange={(event) => setCoverageStartDate(event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="approved-value">Valor final aprovado</Label><Input id="approved-value" min="0" step="0.01" type="number" value={approvedValue} onChange={(event) => setApprovedValue(event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="confirmation-document">Confirmação aprovada da operadora</Label><select id="confirmation-document" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={confirmationDocumentId} onChange={(event) => setConfirmationDocumentId(event.target.value)}><option value="">Selecione um documento</option>{approvedDocuments.map((document) => <option key={document.id} value={document.id}>{document.filename}</option>)}</select></div>
        <div className="sm:col-span-2"><Button type="button" disabled={pending || !policyNumber || !coverageStartDate || !approvedValue || !confirmationDocumentId} onClick={submit}>{pending ? "Registrando..." : "Registrar venda"}</Button></div>
      </CardContent>
    </Card>
  );
}
