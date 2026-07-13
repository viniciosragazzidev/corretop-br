import Link from "next/link";

import { createTenantAction, setTenantStatusAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlatformAdminHeader } from "@/components/platform-admin-header";
import { getPlatformTenants } from "@/features/platform-admin/service";

const statusLabel = {
  active: "Ativo",
  inactive: "Inativo",
  delinquent: "Inadimplente",
} as const;

export default async function SuperAdminPage() {
  const tenants = await getPlatformTenants();

  return (
    <>
      <PlatformAdminHeader breadcrumb="CorreTop / Plataforma" title="Super administração" />

      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6" id="visao-geral">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">ACESSO RESTRITO</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Empresas da plataforma</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Onboarding, status de acesso e visão dos membros por corretora.
            </p>
          </div>

          <div className="w-full max-w-72">
            <Input aria-label="Buscar empresa" className="bg-muted" placeholder="Buscar empresa" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Corretoras cadastradas</CardTitle>
              <CardDescription>{tenants.length} empresa(s) com acesso à plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="pl-5">
                        <Link className="font-medium hover:text-primary" href={`/super-admin/tenants/${tenant.id}`}>
                          {tenant.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("pt-BR").format(tenant.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>{tenant.cnpj ?? "—"}</TableCell>
                      <TableCell>{tenant.subscriptionPlan}</TableCell>
                      <TableCell>
                        {tenant.status === "active" ? (
                          <Badge variant="success">{statusLabel[tenant.status]}</Badge>
                        ) : tenant.status === "delinquent" ? (
                          <Badge variant="warning">{statusLabel[tenant.status]}</Badge>
                        ) : (
                          <Badge variant="outline">{statusLabel[tenant.status]}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-5">
                        <form action={setTenantStatusAction}>
                          <input name="tenantId" type="hidden" value={tenant.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={tenant.status === "active" ? "inactive" : "active"}
                          />
                          <Button size="sm" variant="ghost">
                            {tenant.status === "active" ? "Desativar" : "Ativar"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Nova empresa</CardTitle>
              <CardDescription>Cria a corretora e sua filial Matriz.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createTenantAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome fantasia</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Razão social</Label>
                  <Input id="legalName" name="legalName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" name="cnpj" inputMode="numeric" placeholder="Somente números" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlan">Plano</Label>
                  <Input id="subscriptionPlan" name="subscriptionPlan" defaultValue="Essencial" required />
                </div>
                <Button className="w-full" type="submit">
                  Criar empresa
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
