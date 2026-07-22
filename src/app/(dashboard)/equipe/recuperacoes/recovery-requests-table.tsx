"use client";

import { useActionState, useState } from "react";
import { Check, X, Loader2, Clock, CheckCircle, XCircle, Ban, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveResetAction, rejectResetAction, type RecoveryActionState } from "./actions";

type ResetRequest = {
  id: string;
  userId: string;
  userEmail: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  directorNotes: string | null;
  userName: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "requested":
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="size-3" />
          Pendente
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="size-3" />
          Aprovada
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Rejeitada
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary" className="gap-1">
          <Check className="size-3" />
          Concluída
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function RecoveryRequestsTable({ requests }: { requests: ResetRequest[] }) {
  const [rejectDialog, setRejectDialog] = useState<{ id: string; email: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailsDialog, setDetailsDialog] = useState<ResetRequest | null>(null);

  const [approveState, approveAction, approvePending] = useActionState<RecoveryActionState, FormData>(
    approveResetAction,
    {},
  );
  const [rejectState, rejectAction, rejectPending] = useActionState<RecoveryActionState, FormData>(
    rejectResetAction,
    {},
  );

  // Show toast feedback
  if (approveState.message) { toast.success(approveState.message); approveState.message = undefined; }
  if (approveState.error) { toast.error(approveState.error); approveState.error = undefined; }
  if (rejectState.message) { toast.success(rejectState.message); rejectState.message = undefined; }
  if (rejectState.error) { toast.error(rejectState.error); rejectState.error = undefined; }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Solicitada em</TableHead>
              <TableHead>Análise</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma solicitação de recuperação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className={req.status === "requested" ? "bg-amber-50/40 dark:bg-amber-950/10" : undefined}>
                  <TableCell className="font-medium">{req.userName}</TableCell>
                  <TableCell className="text-muted-foreground">{req.userEmail}</TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.reviewedAt ? formatDate(req.reviewedAt) : "—"}
                    {req.directorNotes && (
                      <button
                        type="button"
                        onClick={() => setDetailsDialog(req)}
                        className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Eye className="size-3" />
                        Ver justificativa
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === "requested" ? (
                      <div className="flex items-center justify-end gap-2">
                        <form action={approveAction}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="default"
                            disabled={approvePending}
                            className="h-8 gap-1"
                          >
                            {approvePending ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            Aprovar
                          </Button>
                        </form>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-red-600 hover:text-red-700"
                          onClick={() => setRejectDialog({ id: req.id, email: req.userEmail })}
                        >
                          <X className="size-3" />
                          Rejeitar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {req.status === "approved" ? "Link enviado" :
                         req.status === "completed" ? "Senha redefinida" :
                         req.status === "rejected" ? (req.directorNotes ? "Com justificativa" : "Sem justificativa") :
                         "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject dialog with reason */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(""); } }}>
        <DialogPopup overlayClassName="z-50">
          <DialogPanel>
            <DialogHeader>
              <DialogTitle>Rejeitar solicitação</DialogTitle>
              <DialogDescription>
                Deseja rejeitar a solicitação de <strong>{rejectDialog?.email}</strong>?
                Você pode opcionalmente informar uma justificativa.
              </DialogDescription>
            </DialogHeader>
            <form
              action={async (formData: FormData) => {
                if (rejectReason) formData.set("reason", rejectReason);
                await rejectAction(formData);
                setRejectDialog(null);
                setRejectReason("");
              }}
            >
              <input type="hidden" name="requestId" value={rejectDialog?.id ?? ""} />
              <div className="space-y-4">
                <div>
                  <label htmlFor="reject-reason" className="text-sm font-medium">
                    Justificativa <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Ex: O colaborador deve procurar o RH presencialmente..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setRejectDialog(null); setRejectReason(""); }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="destructive" disabled={rejectPending}>
                    {rejectPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Ban className="size-4" />
                    )}
                    Rejeitar solicitação
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogPanel>
        </DialogPopup>
      </Dialog>

      {/* Details dialog for director notes */}
      <Dialog open={!!detailsDialog} onOpenChange={(open) => { if (!open) setDetailsDialog(null); }}>
        <DialogPopup overlayClassName="z-50">
          <DialogPanel>
            <DialogHeader>
              <DialogTitle>Detalhes da rejeição</DialogTitle>
              <DialogDescription>
                Solicitação de <strong>{detailsDialog?.userName}</strong> ({detailsDialog?.userEmail})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Justificativa do diretor</p>
                <p className="mt-1 rounded-md bg-muted p-3 text-sm">{detailsDialog?.directorNotes ?? "Nenhuma justificativa fornecida."}</p>
              </div>
              {detailsDialog?.reviewedAt && (
                <p className="text-xs text-muted-foreground">
                  Analisada em {formatDate(detailsDialog.reviewedAt)}
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Fechar</Button>} />
            </DialogFooter>
          </DialogPanel>
        </DialogPopup>
      </Dialog>
    </>
  );
}
