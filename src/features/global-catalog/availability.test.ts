import { describe, expect, it } from "vitest";

import { resolveTenantGlobalPlanVisibility } from "./availability";

describe("resolveTenantGlobalPlanVisibility", () => {
  const plans = [
    { planId: "global-plan-a", carrierName: "Operadora A" },
    { planId: "global-plan-b", carrierName: "Operadora B" },
  ];

  it("makes every published global plan available when the tenant has no override", () => {
    expect(resolveTenantGlobalPlanVisibility(plans, [])).toEqual(plans);
  });

  it("hides only plans explicitly disabled for the tenant", () => {
    expect(resolveTenantGlobalPlanVisibility(plans, [
      { globalPlanId: "global-plan-a", enabled: false },
      { globalPlanId: "global-plan-b", enabled: true },
    ])).toEqual([{ planId: "global-plan-b", carrierName: "Operadora B" }]);
  });
});
