import type { AssignmentStrategy } from "./types";

export type EligibleBroker = { id: string; createdAt: Date; activeLeads: number; capacity: number | null };

export function chooseBroker(brokers: EligibleBroker[], strategy: AssignmentStrategy): EligibleBroker | null {
  const eligible = brokers.filter((broker) => broker.capacity === null || broker.activeLeads < broker.capacity);
  if (!eligible.length) return null;
  return [...eligible].sort((a, b) => strategy === "round_robin" ? a.createdAt.getTime() - b.createdAt.getTime() : a.activeLeads - b.activeLeads || a.createdAt.getTime() - b.createdAt.getTime())[0] ?? null;
}

export function isValidDutyWindow(dayOfWeek: number, startsAt: string, endsAt: string) {
  return dayOfWeek >= 0 && dayOfWeek <= 6 && /^([01]\d|2[0-3]):[0-5]\d$/.test(startsAt) && /^([01]\d|2[0-3]):[0-5]\d$/.test(endsAt) && startsAt < endsAt;
}
