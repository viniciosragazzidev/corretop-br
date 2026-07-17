import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContextNote } from "@/components/ui/context-note";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAvailableCatalogPlans } from "@/features/global-catalog/queries";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";

export default async function CatalogPage() {
  const context = await getRequiredTenantContext();
  const plans = await listAvailableCatalogPlans(context);
  const globalPlans = plans.filter((plan) => plan.source === "global").length;
  const privatePlans = plans.length - globalPlans;

  return (
    <>
      <DashboardHeader breadcrumb="Operação comercial" title="Catálogo" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">CATÁLOGO COMERCIAL</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Planos disponíveis para a sua corretora</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Consulte os planos oficiais publicados pela CorreTop e, quando houver, os acordos exclusivos da sua corretora. A mesma lista é usada ao criar leads e cotações.</p>
          </div>
          {context.role === "director" ? <Button render={<Link href="/catalogo/interno" />} size="sm" variant="outline">Gerenciar acordos internos</Button> : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border bg-card shadow-none"><CardHeader className="py-4"><CardDescription>Planos oficiais</CardDescription><CardTitle className="text-2xl tabular-nums">{globalPlans}</CardTitle></CardHeader></Card>
          <Card className="border-border bg-card shadow-none"><CardHeader className="py-4"><CardDescription>Acordos internos</CardDescription><CardTitle className="text-2xl tabular-nums">{privatePlans}</CardTitle></CardHeader></Card>
        </section>

        <Card className="border-border bg-card shadow-none">
          <CardHeader><CardTitle>Lista de planos</CardTitle><CardDescription>Disponibilidade já considera publicação global, escopo da corretora e possíveis restrições da unidade.</CardDescription></CardHeader>
          <CardContent className="p-0">
            {plans.length ? <Table><TableHeader><TableRow><TableHead className="pl-5">Operadora</TableHead><TableHead>Plano</TableHead><TableHead>Tipo</TableHead><TableHead>Abrangência</TableHead><TableHead className="pr-5">Origem</TableHead></TableRow></TableHeader><TableBody>{plans.map((plan) => <TableRow key={`${plan.source}:${plan.planId}`}><TableCell className="pl-5 font-medium">{plan.carrierName}</TableCell><TableCell>{plan.planName}</TableCell><TableCell className="capitalize">{plan.planType}</TableCell><TableCell>{plan.coverage ?? "Não informada"}</TableCell><TableCell className="pr-5"><Badge variant="outline">{plan.source === "global" ? "Oficial CorreTop" : "Acordo interno"}</Badge></TableCell></TableRow>)}</TableBody></Table> : <div className="p-5"><ContextNote title="Nenhum plano disponível" variant="info">Quando o Super-admin publicar um plano oficial, ele aparecerá aqui automaticamente. Diretores também podem adicionar acordos exclusivos no catálogo interno.</ContextNote></div>}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
