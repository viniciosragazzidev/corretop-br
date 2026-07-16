"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  FileText,
  Eye,
  Plus,
  FolderSimple,
} from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { confirmDocumentUploadAction } from "@/features/documents/actions";

type Requirement = {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  appliesPerBeneficiary?: boolean;
};

type UserDoc = {
  id: string;
  filename: string;
  fileUrl: string;
  status: string;
  requirementId: string | null;
  beneficiaryId: string | null;
};

type Beneficiary = { id: string; name: string; isHolder: boolean };

const documentFolderOrder = ["Identificação", "Dependentes", "Proposta e contratação", "Pós-venda", "Outros"] as const;

function getDocumentFolder(name: string, appliesPerBeneficiary: boolean) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (appliesPerBeneficiary || normalized.includes("depend") || normalized.includes("benefici")) return "Dependentes";
  if (normalized.includes("contrat") || normalized.includes("propost") || normalized.includes("apolice") || normalized.includes("plano")) return "Proposta e contratação";
  if (normalized.includes("renova") || normalized.includes("cancel") || normalized.includes("vigenc")) return "Pós-venda";
  if (normalized.includes("cpf") || normalized.includes("rg") || normalized.includes("identidade") || normalized.includes("documento pessoal")) return "Identificação";
  return "Outros";
}

export function LeadDocumentsSection({
  leadId,
  requirements,
  documents: initialDocs,
  beneficiaries,
}: {
  leadId: string;
  requirements: Requirement[];
  documents: UserDoc[];
  beneficiaries?: Beneficiary[];
}) {
  const [documents] = useState<UserDoc[]>(initialDocs);
  const [selectedBeneficiaryByRequirement, setSelectedBeneficiaryByRequirement] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, reqId: string | null, beneficiaryId: string | null = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite de 10MB.");
      return;
    }

    setUploadingId(reqId || "avulso");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("leadId", leadId);

    try {
      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Erro no upload.");
      }

      const data = await uploadRes.json();

      startTransition(async () => {
        const res = await confirmDocumentUploadAction({
          leadId,
          requirementId: reqId,
          beneficiaryId,
          filename: data.filename,
          fileUrl: data.fileUrl,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Documento enviado com sucesso!");
          // Reload page/state
          window.location.reload();
        }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no envio.");
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-amber-300/30 bg-amber-300/10 text-amber-200">Aguardando revisão</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-emerald-300/30 bg-emerald-300/10 text-emerald-200">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const groupedRequirements = documentFolderOrder
    .map((folder) => [folder, requirements.filter((requirement) => getDocumentFolder(requirement.name, Boolean(requirement.appliesPerBeneficiary)) === folder)] as const)
    .filter(([, folderRequirements]) => folderRequirements.length > 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {groupedRequirements.map(([folder, folderRequirements]) => (
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card" key={folder}>
            <header className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><FolderSimple className="size-4" /></span>
                <div><h4 className="text-sm font-semibold">{folder}</h4><p className="text-[11px] text-muted-foreground">{folderRequirements.length} requisito{folderRequirements.length !== 1 ? "s" : ""}</p></div>
              </div>
              <Badge variant="outline" className="text-[10px]">{folderRequirements.filter((requirement) => documents.some((document) => document.requirementId === requirement.id)).length}/{folderRequirements.length}</Badge>
            </header>
            <div className="space-y-2 p-3">
        {folderRequirements.map((req) => {
          const relevantDocuments = documents.filter((d) => d.requirementId === req.id);
          const selectedBeneficiaryId = selectedBeneficiaryByRequirement[req.id] ?? beneficiaries?.[0]?.id ?? null;
          const doc = relevantDocuments.find((d) => (req.appliesPerBeneficiary ? d.beneficiaryId === selectedBeneficiaryId : true));

          return (
            <div
              key={req.id}
              className="flex flex-col gap-3 rounded-lg border p-4 bg-card text-xs sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <FileText className="size-4 text-primary shrink-0" />
                  {req.name}
                  {req.required && <span className="text-[10px] text-destructive font-bold uppercase">(Obrigatório)</span>}
                </div>
                {req.description && <p className="text-muted-foreground">{req.description}</p>}
                {req.appliesPerBeneficiary && beneficiaries?.length ? <select aria-label={`Beneficiário do requisito ${req.name}`} className="mt-2 h-8 rounded-md border border-input bg-background px-2 text-xs" value={selectedBeneficiaryId ?? ""} onChange={(event) => setSelectedBeneficiaryByRequirement((current) => ({ ...current, [req.id]: event.target.value }))}>{beneficiaries.map((beneficiary) => <option key={beneficiary.id} value={beneficiary.id}>{beneficiary.name}{beneficiary.isHolder ? " (Titular)" : ""}</option>)}</select> : null}
              </div>

              <div className="flex items-center gap-3">
                {doc ? (
                  <>
                    <div className="flex flex-col items-end gap-1">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        {doc.filename.slice(-20)} <Eye className="size-3.5" />
                      </a>
                      {getStatusBadge(doc.status)}
                    </div>

                    {(doc.status === "rejected" || doc.status === "pending") && (
                      <label className="relative inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border px-2.5 hover:bg-muted text-xs transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.png,.jpeg"
                          className="sr-only"
                          disabled={uploadingId !== null}
                          onChange={(e) => handleUpload(e, req.id, req.appliesPerBeneficiary ? selectedBeneficiaryId : null)}
                        />
                        {uploadingId === req.id ? "Enviando..." : "Substituir"}
                      </label>
                    )}
                  </>
                ) : (
                  <label className="relative inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary/80 text-xs transition-colors gap-1.5 shadow-sm">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.png,.jpeg"
                      className="sr-only"
                      disabled={uploadingId !== null}
                      onChange={(e) => handleUpload(e, req.id, req.appliesPerBeneficiary ? selectedBeneficiaryId : null)}
                    />
                    <Plus className="size-3.5" />
                    {uploadingId === req.id ? "Enviando..." : "Enviar arquivo"}
                  </label>
                )}
              </div>
            </div>
          );
        })}
            </div>
          </section>
        ))}
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading text-xs font-semibold">Documentos Adicionais (Avulsos)</h4>
          <label className="relative inline-flex h-7 cursor-pointer items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted transition-colors gap-1">
            <input
              type="file"
              accept=".pdf,.jpg,.png,.jpeg"
              className="sr-only"
              disabled={uploadingId !== null}
              onChange={(e) => handleUpload(e, null)}
            />
            <Plus className="size-3.5" />
            {uploadingId === "avulso" ? "Enviando..." : "Adicionar outro"}
          </label>
        </div>

        <div className="grid gap-2">
          {documents
            .filter((d) => !d.requirementId)
            .map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 bg-card text-xs"
              >
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {doc.filename} <Eye className="size-3" />
                </a>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
