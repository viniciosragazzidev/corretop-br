import { describe, expect, it } from "vitest";
import { chooseBroker, isValidDutyWindow } from "./domain";

describe("lead distribution domain", () => {
  it("chooses the lowest active workload when capacity is available", () => {
    const result = chooseBroker([
      { id: "a", createdAt: new Date("2026-01-01"), activeLeads: 4, capacity: 5 },
      { id: "b", createdAt: new Date("2026-01-02"), activeLeads: 1, capacity: 5 },
    ], "capacity");
    expect(result?.id).toBe("b");
  });

  it("does not choose a broker at capacity", () => {
    const result = chooseBroker([{ id: "a", createdAt: new Date(), activeLeads: 5, capacity: 5 }], "capacity");
    expect(result).toBeNull();
  });

  it("validates duty windows deterministically", () => {
    expect(isValidDutyWindow(1, "09:00", "18:00")).toBe(true);
    expect(isValidDutyWindow(1, "18:00", "09:00")).toBe(false);
    expect(isValidDutyWindow(8, "09:00", "18:00")).toBe(false);
  });
});
