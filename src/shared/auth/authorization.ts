import "server-only";

import { AuthorizationError } from "./errors";
import type { TenantContext } from "./types";
import type { TenantRole } from "@/shared/db/schema";

export function requireRole(
  context: TenantContext,
  role: TenantRole,
): TenantContext {
  if (context.role !== role) {
    throw new AuthorizationError("The current role is not authorized.");
  }

  return context;
}

export function requireAnyRole(
  context: TenantContext,
  roles: readonly TenantRole[],
): TenantContext {
  if (!roles.includes(context.role)) {
    throw new AuthorizationError("The current role is not authorized.");
  }

  return context;
}

/**
 * Meta Lead Ads is a central intake capability: Directors manage it tenant-wide
 * and Marketing can manage it only when its membership belongs to the matrix
 * (represented by a null branchId). A job title never expands branch access.
 */
export function canManageCentralMetaLeadAds(context: TenantContext): boolean {
  return context.role === "director" || (context.jobTitle === "marketing" && context.branchId === null);
}

export function requireCentralMetaLeadAdsManager(context: TenantContext): TenantContext {
  if (!canManageCentralMetaLeadAds(context)) {
    throw new AuthorizationError("A integração Meta é administrada apenas pelo Diretor ou Marketing da matriz.");
  }

  return context;
}

export function assertTenantAccess(
  context: TenantContext,
  resourceTenantId: string,
): void {
  if (context.tenantId !== resourceTenantId) {
    throw new AuthorizationError("Cross-tenant access is not allowed.");
  }
}

export function assertBranchAccess(
  context: TenantContext,
  resource: { tenantId: string; branchId: string },
): void {
  assertTenantAccess(context, resource.tenantId);

  if (context.role === "director") {
    return;
  }

  if (!context.branchId || context.branchId !== resource.branchId) {
    throw new AuthorizationError("Cross-branch access is not allowed.");
  }
}
