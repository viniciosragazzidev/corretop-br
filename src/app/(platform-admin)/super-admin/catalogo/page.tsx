import { PlatformAdminHeader } from "@/components/platform-admin-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createGlobalCarrierAction,
  createGlobalPlanAction,
  createGlobalPriceTableAction,
  publishGlobalPlanAction,
  setGlobalCatalogCapabilityAction,
  setTenantPlanAvailabilityAction,
} from "@/features/global-catalog/actions";
import { CatalogActionForm } from "@/features/global-catalog/components/catalog-action-form";
import { CatalogStatusBadge } from "@/features/global-catalog/components/catalog-status-badge";
import { getGlobalCatalogAdminData } from "@/features/global-catalog/queries";

const selectClassName = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function SuperAdminCatalogPage() {
  const { enabled, privateEnabled, carriers, plans, tenants } = await getGlobalCatalogAdminData();

  return (
    <>
      <PlatformAdminHeader breadcrumb="CorreTop / Admin" title="Catálogo global" />
      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium text-primary">GOVERNANÇA COMERCIAL</p>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo oficial</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Publique operadoras, planos e tabelas uma vez para a plataforma. A disponibilidade por corretora é explícita; acordos exclusivos permanecem no catálogo interno de cada tenant.
          </p>
        </section>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Capacidades do domínio</CardTitle>
            <CardDescription>Controles globais e reversíveis. Desativar bloqueia novas consultas sem apagar o histórico.</CardDescription>
          </CardHeader>
          <CardContent>
            <CatalogActionForm action={setGlobalCatalogCapabilityAction} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" submitLabel="Salvar capacidades">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                <label className="flex items-start gap-2 text-sm"><input className="mt-0.5 size-4" defaultChecked={enabled} name="globalEnabled" type="checkbox" value="true" /><span><span className="font-medium">Catálogo oficial ativo</span><span className="block text-xs text-muted-foreground">Permite consultar planos globais publicados e autorizados.</span></span></label>
                <label className="flex items-start gap-2 text-sm"><input className="mt-0.5 size-4" defaultChecked={privateEnabled} name="privateEnabled" type="checkbox" value="true" /><span><span className="font-medium">Extensões privadas ativas</span><span className="block text-xs text-muted-foreground">Mantém acordos exclusivos isolados por corretora.</span></span></label>
              </div>
            </CatalogActionForm>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border bg-card shadow-none">
            <CardHeader><CardTitle>Nova operadora oficial</CardTitle><CardDescription>Começa como rascunho e passa a compor o catálogo apenas quando seus planos/tabelas forem publicados.</CardDescription></CardHeader>
            <CardContent>
              <CatalogActionForm action={createGlobalCarrierAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end" submitLabel="Criar operadora">
                <label className="grid gap-1.5 text-sm"><span>Nome</span><Input name="name" placeholder="Ex.: Operadora Nacional" required /></label>
                <label className="grid gap-1.5 text-sm"><span>Código ANS</span><Input name="ansCode" placeholder="Opcional" /></label>
              </CatalogActionForm>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-none">
            <CardHeader><CardTitle>Novo plano oficial</CardTitle><CardDescription>O plano fica em rascunho até a publicação da tabela comercial.</CardDescription></CardHeader>
            <CardContent>
              <CatalogActionForm action={createGlobalPlanAction} className="grid gap-3 sm:grid-cols-2" submitLabel="Criar plano">
                <label className="grid gap-1.5 text-sm"><span>Operadora</span><select className={selectClassName} name="carrierId" required defaultValue=""><option disabled value="">Selecione</option>{carriers.map((carrier) => <option key={carrier.id} value={carrier.id}>{carrier.name}</option>)}</select></label>
                <label className="grid gap-1.5 text-sm"><span>Nome do plano</span><Input name="name" required /></label>
                <label className="grid gap-1.5 text-sm"><span>Tipo</span><select className={selectClassName} name="type" defaultValue="individual"><option value="individual">Individual</option><option value="familiar">Familiar</option><option value="empresarial">Empresarial</option><option value="pme">PME</option></select></label>
                <label className="grid gap-1.5 text-sm"><span>Abrangência</span><Input name="coverage" placeholder="Nacional, regional..." /></label>
              </CatalogActionForm>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border bg-card shadow-none">
          <CardHeader><CardTitle>Publicar primeira tabela</CardTitle><CardDescription>Cria uma versão comercial imutável, publica o plano e registra a primeira faixa de preço.</CardDescription></CardHeader>
          <CardContent>
            <CatalogActionForm action={createGlobalPriceTableAction} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 xl:items-end" submitLabel="Publicar tabela">
              <label className="grid gap-1.5 text-sm"><span>Plano</span><select className={selectClassName} name="planId" required defaultValue=""><option disabled value="">Selecione</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.carrierName} — {plan.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm"><span>Tabela</span><Input name="name" placeholder="Tabela julho/2026" required /></label>
              <label className="grid gap-1.5 text-sm"><span>Faixa</span><Input defaultValue="0-18" name="ageBand" required /></label>
              <label className="grid gap-1.5 text-sm"><span>Valor mensal</span><Input min="0.01" name="monthlyPrice" required step="0.01" type="number" /></label>
              <label className="grid gap-1.5 text-sm"><span>Vigência inicial</span><Input name="effectiveFrom" required type="date" /></label>
            </CatalogActionForm>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.6fr)]">
          <Card className="border-border bg-card shadow-none">
            <CardHeader><CardTitle>Planos oficiais</CardTitle><CardDescription>Rascunhos não ficam disponíveis a nenhuma corretora.</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow><TableHead className="pl-5">Operadora</TableHead><TableHead>Plano</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Ação</TableHead></TableRow></TableHeader><TableBody>
                {plans.map((plan) => <TableRow key={plan.id}><TableCell className="pl-5 font-medium">{plan.carrierName}</TableCell><TableCell>{plan.name}</TableCell><TableCell className="capitalize">{plan.type}</TableCell><TableCell><CatalogStatusBadge status={plan.status} /></TableCell><TableCell className="pr-5 text-right">{plan.status !== "published" ? <CatalogActionForm action={publishGlobalPlanAction} className="inline-flex" submitLabel="Publicar" submitVariant="outline"><input name="planId" type="hidden" value={plan.id} /></CatalogActionForm> : <span className="text-xs text-muted-foreground">Disponível para liberação</span>}</TableCell></TableRow>)}
                {plans.length === 0 ? <TableRow><TableCell className="p-6 text-center text-sm text-muted-foreground" colSpan={5}>Nenhum plano oficial cadastrado.</TableCell></TableRow> : null}
              </TableBody></Table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-none">
            <CardHeader><CardTitle>Disponibilidade por corretora</CardTitle><CardDescription>Allow-list: um plano oficial só aparece após liberação explícita.</CardDescription></CardHeader>
            <CardContent>
              <CatalogActionForm action={setTenantPlanAvailabilityAction} className="grid gap-3" submitLabel="Salvar disponibilidade">
                <label className="grid gap-1.5 text-sm"><span>Corretora</span><select className={selectClassName} name="tenantId" required defaultValue=""><option disabled value="">Selecione</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>
                <label className="grid gap-1.5 text-sm"><span>Plano publicado</span><select className={selectClassName} name="globalPlanId" required defaultValue=""><option disabled value="">Selecione</option>{plans.filter((plan) => plan.status === "published").map((plan) => <option key={plan.id} value={plan.id}>{plan.carrierName} — {plan.name}</option>)}</select></label>
                <label className="grid gap-1.5 text-sm"><span>Estado</span><select className={selectClassName} name="enabled" defaultValue="true"><option value="true">Habilitar para a corretora</option><option value="false">Ocultar da corretora</option></select></label>
              </CatalogActionForm>
              <p className="mt-4 text-xs text-muted-foreground">Restrições por unidade e importações versionadas serão conectadas a esta mesma superfície na próxima etapa.</p>
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-muted-foreground">{carriers.length} operadora(s) oficial(is) · {plans.length} plano(s) catalogado(s) <Badge className="ml-2" variant="outline">Auditável</Badge></p>
      </main>
    </>
  );
}
