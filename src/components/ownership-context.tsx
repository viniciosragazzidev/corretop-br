import { cn } from "@/lib/utils";

type OwnershipContextProps = {
  brokerName: string | null | undefined;
  branchName: string | null | undefined;
  className?: string;
  emptyLabel?: string;
};

export function OwnershipContext({ brokerName, branchName, className, emptyLabel = "Aguardando distribuição" }: OwnershipContextProps) {
  if (!brokerName && !branchName) return <span className={cn("text-muted-foreground", className)}>{emptyLabel}</span>;
  return <span className={cn("inline-flex min-w-0 flex-wrap items-baseline gap-x-1", className)}><span className="font-medium text-foreground">{brokerName ?? "Sem corretor"}</span><span className="text-muted-foreground">· {branchName ?? "Sem unidade"}</span></span>;
}
