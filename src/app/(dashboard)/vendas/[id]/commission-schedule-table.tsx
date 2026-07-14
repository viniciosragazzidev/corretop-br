"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "@/components/huge-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  markCommissionPaidAction,
  markCommissionUnpaidAction,
  type SaleActionState,
} from "@/features/sales/actions";

type ScheduleItem = {
  id: string;
  saleId: string;
  monthNumber: number;
  referenceMonth: string;
  dueDate: string | null;
  percentage: string;
  amount: string;
  status: "pending" | "paid" | "cancelled";
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
      <Badge variant="success" className="border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
        Pago
      </Badge>
    );
  }
  if (status === "cancelled") {
    return <Badge variant="outline" className="text-muted-foreground">Cancelado</Badge>;
  }
  return (
    <Badge variant="outline" className="border-amber-300/30 text-amber-600 dark:text-amber-400">
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
    <TableRow>
      <TableCell className="font-medium">{item.monthNumber}º mês</TableCell>
      <TableCell className="text-muted-foreground">{item.referenceMonth}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(item.dueDate)}</TableCell>
      <TableCell className="font-mono text-sm">{item.percentage}%</TableCell>
      <TableCell className="font-mono text-sm font-medium">{formatCurrency(item.amount)}</TableCell>
      <TableCell>
        <ScheduleStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {item.status === "paid"
          ? `${item.paidByName ?? "—"} em ${formatDate(item.paidAt)}`
          : item.status === "cancelled"
            ? "Cancelado"
            : "—"}
      </TableCell>
      <TableCell className="text-right">
        {canManage && item.status === "pending" && (
          <form action={payAction}>
            <input type="hidden" name="scheduleId" value={item.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={payPending}
              className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              aria-label={`Marcar ${item.monthNumber}º mês como pago`}
            >
              <CheckCircle className="size-4" /> Pagar
            </Button>
          </form>
        )}
        {canManage && item.status === "paid" && (
          <form action={unpayAction}>
            <input type="hidden" name="scheduleId" value={item.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={unpayPending}
              className="text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
              aria-label={`Reverter ${item.monthNumber}º mês`}
            >
              <XCircle className="size-4" /> Reverter
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
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-medium">Nenhuma parcela gerada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O cronograma de repasse será gerado automaticamente ao converter o lead em venda.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-5">Parcela</TableHead>
          <TableHead>Mês ref.</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>%</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pago em</TableHead>
          <TableHead className="pr-5 text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedule.map((item) => (
          <ScheduleRow key={item.id} item={item} canManage={canManage} />
        ))}
      </TableBody>
    </Table>
  );
}
