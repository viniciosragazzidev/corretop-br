import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getWhatsAppConnection } from "../whatsapp-actions";
import { WhatsAppPage } from "../whatsapp-page";
import { getMetaCloudConfigurationState } from "@/features/communication-channels/meta-cloud-config";
import { isMetaCloudWhatsAppEnabled } from "@/features/communication-channels/service";
import { getDatabase, schema } from "@/shared/db";
import { and, asc, eq } from "drizzle-orm";

export default async function WhatsAppSettingsPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const context = await getRequiredTenantContext();
  const { returnTo: requestedReturnTo } = await searchParams;
  const returnTo = requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : undefined;
  const db = getDatabase();
  const [initial, metaEnabled, channels, branches] = await Promise.all([
    getWhatsAppConnection(),
    isMetaCloudWhatsAppEnabled(),
    db.select({ id: schema.communicationChannels.id, displayPhoneNumber: schema.communicationChannels.displayPhoneNumber, verifiedName: schema.communicationChannels.verifiedName, branchName: schema.branches.name, status: schema.communicationChannels.status, qualityRating: schema.communicationChannels.qualityRating, isDefault: schema.communicationChannels.isDefault }).from(schema.communicationChannels).leftJoin(schema.branches, eq(schema.communicationChannels.branchId, schema.branches.id)).where(and(eq(schema.communicationChannels.tenantId, context.tenantId), eq(schema.communicationChannels.provider, "meta_cloud"))).orderBy(asc(schema.communicationChannels.displayPhoneNumber)),
    context.role === "director" ? db.select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).where(and(eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.status, "active"))).orderBy(asc(schema.branches.name)) : Promise.resolve([] as { id: string; name: string }[]),
  ]);
  return <><DashboardHeader breadcrumb="Configurações" title="Integração WhatsApp" /><WhatsAppPage initial={initial} returnTo={returnTo} official={{ ...getMetaCloudConfigurationState(), enabled: metaEnabled, canConfigure: context.role === "director", branches, channels }} /></>;
}
