import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getWhatsAppConnection } from "../whatsapp-actions";
import { WhatsAppPage } from "../whatsapp-page";

export default async function WhatsAppSettingsPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  await getRequiredTenantContext();
  const { returnTo: requestedReturnTo } = await searchParams;
  const returnTo = requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : undefined;
  return <><DashboardHeader breadcrumb="Configurações" title="Integração WhatsApp" /><WhatsAppPage initial={await getWhatsAppConnection()} returnTo={returnTo} /></>;
}
