import { count, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { randomUUID } from "node:crypto";

import { DashboardHeader } from "@/components/dashboard-header";
import { CatalogStats } from "@/features/catalog/components/catalog-stats";
import { CarriersGrid } from "@/features/catalog/components/catalog-client";
import { FIXED_CARRIERS } from "@/features/catalog/constants";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function CatalogPage() {
  const context = await getRequiredTenantContext();
  if (context.role !== "director") redirect("/access-denied");

  const db = getDatabase();

  // Auto-seed carriers if none exist for this tenant
  const existingCount = await db
    .select({ count: count() })
    .from(schema.carriers)
    .where(eq(schema.carriers.tenantId, context.tenantId));

  if (existingCount[0]?.count === 0) {
    await db.insert(schema.carriers).values(
      FIXED_CARRIERS.map((name) => ({
        id: randomUUID(),
        tenantId: context.tenantId,
        name,
        status: "active" as const,
      })),
    );
  }

  // Get carriers with plan counts using a subquery
  const planCounts = db
    .select({
      carrierId: schema.carrierPlans.carrierId,
      count: count(schema.carrierPlans.id).as("plan_count"),
    })
    .from(schema.carrierPlans)
    .groupBy(schema.carrierPlans.carrierId)
    .as("plan_counts");

  const carriers = await db
    .select({
      id: schema.carriers.id,
      tenantId: schema.carriers.tenantId,
      name: schema.carriers.name,
      ansCode: schema.carriers.ansCode,
      contact: schema.carriers.contact,
      phone: schema.carriers.phone,
      email: schema.carriers.email,
      status: schema.carriers.status,
      notes: schema.carriers.notes,
      planCount: sql<number>`coalesce(${planCounts.count}, 0)::int`,
    })
    .from(schema.carriers)
    .leftJoin(planCounts, eq(schema.carriers.id, planCounts.carrierId))
    .where(eq(schema.carriers.tenantId, context.tenantId))
    .orderBy(schema.carriers.name);

  const activeCarriers = carriers.filter((c) => c.status === "active");
  const totalPlans = carriers.reduce((sum, c) => sum + c.planCount, 0);

  return (
    <>
      <DashboardHeader breadcrumb="Administracao" title="Catálogo" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">ESTRUTURA COMERCIAL</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Operadoras e Planos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure as operadoras que sua corretora trabalha e os planos
              oferecidos em cada uma. Os nomes das operadoras são fixos — você
              define os dados de contato, status e os planos disponíveis.
            </p>
          </div>
        </section>

        <CatalogStats
          totalCarriers={carriers.length}
          activeCarriers={activeCarriers.length}
          totalPlans={totalPlans}
        />

        <CarriersGrid carriers={carriers} />
      </main>
    </>
  );
}
