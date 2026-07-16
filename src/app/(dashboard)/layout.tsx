import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AuthorizationError, AuthenticationError } from "@/shared/auth/errors";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { AppShell } from "@/components/app-shell";
import { getDatabase, schema } from "@/shared/db";
import { TenantOnboardingDialogLoader } from "@/features/onboarding/components/tenant-onboarding-dialog-loader";
import { DirectorWizardLoader } from "@/features/onboarding/components/director-wizard-loader";
import { RealtimeSyncProvider } from "@/components/providers/realtime-sync-provider";
import { NotificationCountProvider } from "@/components/providers/notification-count-provider";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let context;
  try {
    context = await getRequiredTenantContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login");
    if (error instanceof AuthorizationError) redirect("/access-denied");
    throw error;
  }

  const [tenant] = await getDatabase()
    .select({
      name: schema.tenants.name,
      brandColor: schema.tenants.brandColor,
      logoUrl: schema.tenants.logoUrl,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, context.tenantId))
    .limit(1);

  return (
    <AppShell
      branding={{
        tenantName: tenant?.name ?? null,
        brandColor: tenant?.brandColor ?? null,
        logoUrl: tenant?.logoUrl ?? null,
      }}
    >
      <TenantOnboardingDialogLoader />
      <DirectorWizardLoader />
      <RealtimeSyncProvider
        tenantId={context.tenantId}
        userId={context.userId}
        role={context.role}
        branchId={context.branchId}
      >
        <NotificationCountProvider userId={context.userId}>
          {children}
        </NotificationCountProvider>
      </RealtimeSyncProvider>
    </AppShell>
  );
}
