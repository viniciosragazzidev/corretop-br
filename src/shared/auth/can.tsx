import type { ReactNode } from "react";

import { hasPermission, type PermissionKey } from "./permissions";
import type { TenantRole } from "@/shared/db/schema";

export function Can({ role, permission, children }: { role: TenantRole | string | null | undefined; permission: PermissionKey; children: ReactNode }) {
  return hasPermission(role, permission) ? children : null;
}
