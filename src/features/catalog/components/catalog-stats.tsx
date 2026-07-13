import { Card, CardContent } from "@/components/ui/card";

export function CatalogStats({
  totalCarriers,
  activeCarriers,
  totalPlans,
}: {
  totalCarriers: number;
  activeCarriers: number;
  totalPlans: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card size="sm" className="border-border bg-card shadow-none">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Operadoras</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{totalCarriers}</p>
        </CardContent>
      </Card>
      <Card size="sm" className="border-border bg-card shadow-none">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Operadoras ativas</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-emerald-500">{activeCarriers}</p>
        </CardContent>
      </Card>
      <Card size="sm" className="border-border bg-card shadow-none">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Planos cadastrados</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{totalPlans}</p>
        </CardContent>
      </Card>
    </div>
  );
}
