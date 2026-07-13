import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getWhatsAppConnection } from "../whatsapp-actions";
import { WhatsAppPage } from "../whatsapp-page";

export default async function WhatsAppSettingsPage() {
  const context = await getRequiredTenantContext();
  return <><DashboardHeader breadcrumb="Configurações" title="Integração WhatsApp" /><WhatsAppPage initial={await getWhatsAppConnection()} /></>;
}
