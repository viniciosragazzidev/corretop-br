import { eq, desc } from "drizzle-orm";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { ClientesList } from "./clientes-list";

export default async function CustomersPage() {
  const context = await getRequiredTenantContext();
  const clients = await getDatabase().select({ id: schema.clients.id, name: schema.clients.nome, phone: schema.clients.telefone, email: schema.clients.email, convertedAt: schema.clients.convertedAt, brokerName: schema.user.name }).from(schema.clients).leftJoin(schema.user, eq(schema.clients.corretorId, schema.user.id)).where(eq(schema.clients.tenantId, context.tenantId)).orderBy(desc(schema.clients.convertedAt));
  return <><DashboardHeader breadcrumb="Pós-venda" title="Clientes" /><main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6"><div><p className="text-xs font-medium text-primary">PÓS-VENDA</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Clientes</h1><p className="mt-1 text-sm text-muted-foreground">Leads convertidos e prontos para acompanhamento.</p></div><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Clientes ativos <Badge className="ml-2" variant="outline">{clients.length}</Badge></CardTitle></CardHeader><CardContent className="p-0"><ClientesList clients={clients} /></CardContent></Card></main></>;
}
