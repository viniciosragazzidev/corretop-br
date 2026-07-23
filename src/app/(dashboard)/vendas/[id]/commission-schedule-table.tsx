"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, CalendarBlank, FileText } from "@/components/huge-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  markCommissionPaidAction,
  markCommissionUnpaidAction,
  type SaleActionState,
} from "@/features/sales/actions";

export type ScheduleItem = {
  id: string;
  saleId: string;
  monthNumber: number;
  referenceMonth: string;
  dueDate: string | null;
  percentage: string;
  amount: string;
  status: "pending" | "paid" | "cancelled" | "chargeback_pending";
  paidAt: string | null;
  paidBy: string | null;
  paidByName: string | null;
  notes: string | null;
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

function ScheduleStatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <Badge variant="success" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Pago
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground px-2 py-0.5">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        Cancelado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium px-2 py-0.5">
      <span className="size-1.5 rounded-full bg-amber-500" />
      A pagar
    </Badge>
  );
}

function ScheduleRow({
  item,
  canManage,
}: {
  item: ScheduleItem;
  canManage: boolean;
}) {
  const [payState, payAction, payPending] = useActionState<SaleActionState, FormData>(
    markCommissionPaidAction,
    {},
  );

  const [unpayState, unpayAction, unpayPending] = useActionState<SaleActionState, FormData>(
    markCommissionUnpaidAction,
    {},
  );

  // Show toast on state changes
  if (payState.success) toast.success("Comissão marcada como paga.");
  if (payState.error) toast.error(payState.error);
  if (unpayState.success) toast.success("Pagamento revertido.");
  if (unpayState.error) toast.error(unpayState.error);

  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      <TableCell className="pl-5 font-semibold text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-mono font-medium text-primary">
            {item.monthNumber}
          </span>
          <span>{item.monthNumber}º mês</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs">{item.referenceMonth}</TableCell>
      <TableCell className="text-muted-foreground text-xs">{formatDate(item.dueDate)}</TableCell>
      <TableCell className="font-mono text-xs font-medium">
        <span className="rounded bg-muted px-1.5 py-0.5">{item.percentage}%</span>
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-semibold tracking-tight">
        {formatCurrency(item.amount)}
      </TableCell>
      <TableCell>
        <ScheduleStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {item.status === "paid" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="cursor-help underline decoration-dotted underline-offset-4">
                  {item.paidByName ? item.paidByName.split(" ")[0] : "Confirmado"} em {formatDate(item.paidAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Pago por {item.paidByName ?? "Diretoria"} em {formatDate(item.paidAt)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : item.status === "cancelled" ? (
          "Cancelado"
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="pr-5 text-right">
        {canManage && item.status === "pending" && (
          <form action={payAction} className="inline-block">
            <input type="hidden" name="scheduleId" value={item.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={payPending}
              className="h-8 gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 font-medium transition-all"
              aria-label={`Marcar ${item.monthNumber}º mês como pago`}
            >
              <CheckCircle className="size-3.5" /> {payPending ? "Salvando..." : "Marcar Paga"}
            </Button>
          </form>
        )}
        {canManage && item.status === "paid" && (
          <form action={unpayAction} className="inline-block">
            <input type="hidden" name="scheduleId" value={item.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={unpayPending}
              className="h-8 gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 font-medium transition-all"
              aria-label={`Reverter ${item.monthNumber}º mês`}
            >
              <XCircle className="size-3.5" /> {unpayPending ? "Revertendo..." : "Reverter"}
            </Button>
          </form>
        )}
      </TableCell>
    </TableRow>
  );
}

export function CommissionScheduleTable({
  schedule,
  canManage,
}: {
  schedule: ScheduleItem[];
  canManage: boolean;
}) {
  if (schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
          <CalendarBlank className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Nenhuma parcela gerada</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          O cronograma de repasse será gerado automaticamente com base na regra de comissionamento associada a esta venda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider">Parcela</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Mês ref.</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Vencimento</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">%</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Valor</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Pagamento</TableHead>
            <TableHead className="pr-5 text-right text-xs font-semibold uppercase tracking-wider">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((item) => (
            <ScheduleRow key={item.id} item={item} canManage={canManage} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
