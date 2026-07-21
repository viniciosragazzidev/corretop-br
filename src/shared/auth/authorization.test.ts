import { describe, expect, it } from "vitest";

import { canManageCentralMetaLeadAds } from "./authorization";
import type { TenantContext } from "./types";

function context(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    userId: "user-1",
    tenantId: "tenant-1",
    role: "broker",
    jobTitle: "broker",
    branchId: "branch-1",
    ...overrides,
  };
}

describe("canManageCentralMetaLeadAds", () => {
  it("allows the director regardless of branch assignment", () => {
    expect(canManageCentralMetaLeadAds(context({ role: "director", branchId: "branch-1" }))).toBe(true);
  });

  it("allows only Marketing assigned to the matrix", () => {
    expect(canManageCentralMetaLeadAds(context({ jobTitle: "marketing", branchId: null }))).toBe(true);
    expect(canManageCentralMetaLeadAds(context({ jobTitle: "marketing", branchId: "branch-1" }))).toBe(false);
  });

  it("rejects other matrix memberships", () => {
    expect(canManageCentralMetaLeadAds(context({ jobTitle: "operations", branchId: null }))).toBe(false);
  });
});
