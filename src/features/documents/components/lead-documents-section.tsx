"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  FileText,
  Eye,
  Plus
} from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { confirmDocumentUploadAction } from "@/features/documents/actions";

type Requirement = {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
};

type UserDoc = {
  id: string;
  filename: string;
  fileUrl: string;
  status: string;
  requirementId: string | null;
};

export function LeadDocumentsSection({
  leadId,
  requirements,
  documents: initialDocs,
}: {
  leadId: string;
  requirements: Requirement[];
  documents: UserDoc[];
}) {
  const [documents] = useState<UserDoc[]>(initialDocs);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, reqId: string | null) => {
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {requirements.map((req) => {
          const doc = documents.find((d) => d.requirementId === req.id);

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
                          onChange={(e) => handleUpload(e, req.id)}
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
                      onChange={(e) => handleUpload(e, req.id)}
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
