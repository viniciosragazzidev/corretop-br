import { StatCard } from "@/components/dashboard/metric-card";

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
      <StatCard label="Operadoras" value={totalCarriers} />
      <StatCard
        label="Operadoras ativas"
        value={activeCarriers}
        valueClassName="text-emerald-500"
      />
      <StatCard label="Planos cadastrados" value={totalPlans} />
    </div>
  );
}
