import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { AuthorizationError, AuthenticationError } from "@/shared/auth/errors";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { AppShell } from "@/components/app-shell";
import { getDatabase, schema } from "@/shared/db";
import { TenantOnboardingDialogLoader } from "@/features/onboarding/components/tenant-onboarding-dialog-loader";

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

  // Check onboarding redirect — skip for /welcome itself to avoid loops
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!pathname.startsWith("/welcome")) {
    const [membership] = await getDatabase()
      .select({ onboardingDismissedAt: schema.tenantMemberships.onboardingDismissedAt })
      .from(schema.tenantMemberships)
      .where(
        and(
          eq(schema.tenantMemberships.userId, context.userId),
          eq(schema.tenantMemberships.tenantId, context.tenantId),
        )
      )
      .limit(1);

    if (!membership?.onboardingDismissedAt) {
      redirect("/welcome");
    }
  }

  return (
    <AppShell
      branding={{
        tenantName: tenant?.name ?? null,
        brandColor: tenant?.brandColor ?? null,
        logoUrl: tenant?.logoUrl ?? null,
      }}
    >
      <TenantOnboardingDialogLoader />
      {children}
    </AppShell>
  );
}
