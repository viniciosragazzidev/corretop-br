import { and, eq } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappLogo } from "@/components/huge-icons";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { AccountTab } from "./_components/account-tab";
import { EmpresaTab } from "./_components/empresa-tab";
import { IntegrationsTab } from "./_components/integrations-tab";
import { SecurityTab } from "./_components/security-tab";
import { SettingsTabs, type TabId } from "./_components/settings-tabs";
import { UnitTab } from "./_components/unit-tab";
import { FeedbackTab } from "./_components/feedback-tab";
import { getIntegrationsData } from "./integrations-actions";

export default async function SettingsPage() {
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const [tenant, user, membership] = await Promise.all([
    db.select({ name: schema.tenants.name, legalName: schema.tenants.legalName, cnpj: schema.tenants.cnpj, logoUrl: schema.tenants.logoUrl, brandColor: schema.tenants.brandColor }).from(schema.tenants).where(eq(schema.tenants.id, context.tenantId)).limit(1),
    db.select({ name: schema.user.name, email: schema.user.email, twoFactorEnabled: schema.user.twoFactorEnabled }).from(schema.user).where(eq(schema.user.id, context.userId)).limit(1),
    context.branchId ? db.select({ name: schema.branches.name }).from(schema.branches).where(and(eq(schema.branches.id, context.branchId), eq(schema.branches.tenantId, context.tenantId))).limit(1) : Promise.resolve([]),
  ]);
  const [tenantData] = await db.select({
    feedbackReminderIntervalMinutes: schema.tenants.feedbackReminderIntervalMinutes,
    feedbackReminderMaxAttempts: schema.tenants.feedbackReminderMaxAttempts,
    feedbackPushEnabled: schema.tenants.feedbackPushEnabled,
    feedbackToastEnabled: schema.tenants.feedbackToastEnabled,
    feedbackRequiredEnabled: schema.tenants.feedbackRequiredEnabled,
  }).from(schema.tenants).where(eq(schema.tenants.id, context.tenantId)).limit(1);

  const integrations = context.role === "director" ? await getIntegrationsData() : null;
  const tabIds: TabId[] = context.role === "director" ? ["conta", "empresa", "unidade", "atendimento", "whatsapp", "integracoes", "seguranca"] : context.role === "manager" ? ["conta", "unidade", "atendimento", "whatsapp", "seguranca"] : ["conta", "whatsapp", "seguranca"];

  const canEditFeedback = context.role === "director" || context.role === "manager";

  const atendimento = canEditFeedback ? (
    <FeedbackTab
      feedbackReminderInterval={tenantData?.feedbackReminderIntervalMinutes ?? "30"}
      feedbackReminderMaxAttempts={tenantData?.feedbackReminderMaxAttempts ?? 5}
      feedbackPushEnabled={tenantData?.feedbackPushEnabled ?? true}
      feedbackToastEnabled={tenantData?.feedbackToastEnabled ?? true}
      feedbackRequiredEnabled={tenantData?.feedbackRequiredEnabled ?? true}
      canEdit={context.role === "director"}
    />
  ) : undefined;

  const whatsapp = <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>WhatsApp pessoal de atendimento</CardTitle><CardDescription>Conecte somente o número usado por você. A conexão é isolada por usuário e não altera a identidade da corretora.</CardDescription></CardHeader><CardContent><Button render={<a href="/settings/whatsapp" />}><WhatsappLogo /> Configurar meu WhatsApp</Button></CardContent></Card>;
  const account = <AccountTab name={user[0]?.name ?? "Usuário"} email={user[0]?.email ?? ""} role={context.role} />;
  const company = <EmpresaTab canEdit tenant={{ name: tenant[0]?.name ?? "", legalName: tenant[0]?.legalName ?? null, cnpj: tenant[0]?.cnpj ?? null, logoUrl: tenant[0]?.logoUrl ?? null, brandColor: tenant[0]?.brandColor ?? null }} />;

  return <><DashboardHeader breadcrumb="Configurações" title="Configurações" /><div className="flex flex-1 flex-col gap-6 p-4 lg:p-6"><div><p className="text-xs font-medium text-primary">CONFIGURAÇÕES</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Configurações</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Cada perfil vê apenas o que pode administrar: conta, conexão própria, unidade ou identidade da corretora.</p></div><SettingsTabs account={account} company={context.role === "director" ? company : undefined} unit={<UnitTab branchName={membership[0]?.name ?? null} isDirector={context.role === "director"} />} atendimento={atendimento} whatsapp={whatsapp} integrations={integrations ? <IntegrationsTab branches={integrations.branches} integrations={integrations.integrations} /> : undefined} security={<SecurityTab enabled={user[0]?.twoFactorEnabled ?? false} email={user[0]?.email ?? "sua conta"} />} tabIds={tabIds} /></div></>;
}
