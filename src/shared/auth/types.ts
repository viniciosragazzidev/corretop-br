import type { TenantRole } from "@/shared/db/schema";

export const tenantRoles = ["director", "manager", "broker"] as const;

export type TenantContext = {
  userId: string;
  tenantId: string;
  role: TenantRole;
  jobTitle: string;
  branchId: string | null;
};

export type PlatformAdminContext = {
  userId: string;
  email: string;
};
