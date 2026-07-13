import { eq } from "drizzle-orm";

import { EmpresaTab } from "./_components/empresa-tab";
import { SettingsTabs } from "./_components/settings-tabs";
import { IntegrationsTab } from "./_components/integrations-tab";
import { getIntegrationsData } from "./integrations-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { Button } from "@/components/ui/button";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

export default async function SettingsPage() {
  const context = await getRequiredTenantContext();
  const [tenant] = await getDatabase()
    .select({
      name: schema.tenants.name,
      legalName: schema.tenants.legalName,
      cnpj: schema.tenants.cnpj,
      logoUrl: schema.tenants.logoUrl,
      brandColor: schema.tenants.brandColor,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, context.tenantId))
    .limit(1);

  const integrations = context.role === "director" ? await getIntegrationsData() : null;

  return (
    <>
      <DashboardHeader breadcrumb="Configuracoes" title="Area da empresa" />
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div>
          <p className="text-xs font-medium text-primary">CONFIGURACOES</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Area da empresa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as configuracoes e a identidade visual da corretora.
          </p>
          <Button className="mt-4" render={<a href="/settings/whatsapp" />} size="sm" variant="outline"><WhatsappLogo /> Configurar WhatsApp</Button>
        </div>

        <SettingsTabs integrations={integrations ? <IntegrationsTab branches={integrations.branches} integrations={integrations.integrations} /> : undefined} integrationsLocked={context.role !== "director"}>
          <EmpresaTab canEdit={context.role === "director"}
            tenant={{
              name: tenant?.name ?? "",
              legalName: tenant?.legalName ?? null,
              cnpj: tenant?.cnpj ?? null,
              logoUrl: tenant?.logoUrl ?? null,
              brandColor: tenant?.brandColor ?? null,
            }}
          />
        </SettingsTabs>
      </div>
    </>
  );
}
