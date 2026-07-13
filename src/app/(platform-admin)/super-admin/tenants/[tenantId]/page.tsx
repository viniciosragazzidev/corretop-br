import { notFound } from "next/navigation";
const CaretLeft = () => null;
import Link from "next/link";

import { createTenantAccessAction } from "../../actions";
import { CreateTenantAccessForm } from "./_components/create-tenant-access-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformAdminHeader } from "@/components/platform-admin-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlatformTenant, getTenantBranches, getTenantMembers } from "@/features/platform-admin/service";

const roleLabel = { director: "Diretor", manager: "Gestor", broker: "Corretor" } as const;

export default async function TenantDetailPage({ params }: PageProps<"/super-admin/tenants/[tenantId]">) {
  const { tenantId } = await params;
  const [tenant, members, branches] = await Promise.all([getPlatformTenant(tenantId), getTenantMembers(tenantId), getTenantBranches(tenantId)]);
  if (!tenant) notFound();
  return <><PlatformAdminHeader breadcrumb="Super administração / Empresas" title={tenant.name} />
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6"><Link className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground" href="/super-admin"><CaretLeft /> Empresas</Link><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]"><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>{tenant.name}</CardTitle><CardDescription>{tenant.legalName ?? "Razão social não informada"}</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">CNPJ</p><p className="mt-1 text-sm font-medium">{tenant.cnpj ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Plano</p><p className="mt-1 text-sm font-medium">{tenant.subscriptionPlan}</p></div><div><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-1 bg-emerald-500/10 text-emerald-300" variant="secondary">{tenant.status === "active" ? "Ativo" : "Inativo"}</Badge></div></CardContent></Card><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Filiais</CardTitle><CardDescription>{branches.map((branch) => branch.name).join(", ")}</CardDescription></CardHeader></Card></section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]"><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Membros com acesso</CardTitle><CardDescription>Visão somente leitura dos logins vinculados a esta corretora.</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-5">Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Papel</TableHead><TableHead>Filial</TableHead><TableHead className="pr-5">Status</TableHead></TableRow></TableHeader><TableBody>{members.map((member) => <TableRow key={member.id}><TableCell className="pl-5 font-medium">{member.name}</TableCell><TableCell>{member.email}</TableCell><TableCell>{roleLabel[member.role]}</TableCell><TableCell>{member.branchName ?? "—"}</TableCell><TableCell className="pr-5"><Badge variant="outline">{member.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Adicionar acesso</CardTitle><CardDescription>Cria diretamente um login inicial para esta empresa.</CardDescription></CardHeader><CardContent><CreateTenantAccessForm action={createTenantAccessAction} branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))} tenantId={tenant.id} /></CardContent></Card></section></main></>;
}
