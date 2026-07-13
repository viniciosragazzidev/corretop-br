import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

const activeLeadStatuses = ["new", "distributed", "in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"] as const;

export type BrokerDashboardData = {
  userName: string;
  availabilityStatus: "available" | "paused";
  leads: Array<{ id: string; name: string; phone: string; source: string; status: string; createdAt: Date; lastInteractionAt: Date | null }>;
  activeLeads: Array<{ id: string; name: string; status: string; serviceStartedAt: Date | null }>;
  totals: { all: number; active: number; new: number; inContact: number; converted: number };
};

export async function getBrokerDashboardData(): Promise<BrokerDashboardData> {
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const [user, membership, leads] = await Promise.all([
    db.select({ name: schema.user.name }).from(schema.user).where(eq(schema.user.id, context.userId)).limit(1),
    db.select({ availabilityStatus: schema.tenantMemberships.availabilityStatus }).from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.tenantId, context.tenantId), eq(schema.tenantMemberships.userId, context.userId))).limit(1),
    db.select({ id: schema.leads.id, name: schema.leads.nome, phone: schema.leads.telefone, source: schema.leads.origem, status: schema.leads.status, createdAt: schema.leads.createdAt, serviceStartedAt: schema.leads.serviceStartedAt }).from(schema.leads).where(and(eq(schema.leads.tenantId, context.tenantId), eq(schema.leads.corretorId, context.userId))).orderBy(desc(schema.leads.createdAt)),
  ]);
  const interactions = leads.length ? await db.select({ leadId: schema.leadInteractions.leadId, createdAt: schema.leadInteractions.createdAt }).from(schema.leadInteractions).where(inArray(schema.leadInteractions.leadId, leads.map((lead) => lead.id))).orderBy(desc(schema.leadInteractions.createdAt)) : [];
  const latest = new Map<string, Date>();
  for (const interaction of interactions) if (!latest.has(interaction.leadId)) latest.set(interaction.leadId, interaction.createdAt);
  return {
    userName: user[0]?.name ?? "Corretor",
    availabilityStatus: membership[0]?.availabilityStatus ?? "available",
    leads: leads.map((lead) => ({ ...lead, phone: maskPhone(lead.phone), lastInteractionAt: latest.get(lead.id) ?? null })),
    activeLeads: leads.filter((lead) => (activeLeadStatuses as readonly string[]).includes(lead.status) && lead.status !== "new" && lead.status !== "distributed").map((lead) => ({ id: lead.id, name: lead.name, status: lead.status, serviceStartedAt: lead.serviceStartedAt })),
    totals: {
      all: leads.length,
      active: leads.filter((lead) => (activeLeadStatuses as readonly string[]).includes(lead.status)).length,
      new: leads.filter((lead) => lead.status === "new").length,
      inContact: leads.filter((lead) => lead.status === "in_contact").length,
      converted: leads.filter((lead) => lead.status === "converted").length,
    },
  };
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}` : "••••";
}

export type ManagerDashboardData = {
  teamSize: number;
  activeMembers: number;
  leadsTotal: number;
  newLeads: number;
  inContact: number;
  unassigned: number;
  unworked: number;
  stalled: number;
};

export async function getManagerDashboardData(): Promise<ManagerDashboardData> {
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const [members, leads] = await Promise.all([
    db.select({ userId: schema.tenantMemberships.userId, status: schema.tenantMemberships.status }).from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.tenantId, context.tenantId), eq(schema.tenantMemberships.branchId, context.branchId!), eq(schema.tenantMemberships.role, "broker"))),
    db.select({ status: schema.leads.status, corretorId: schema.leads.corretorId, assignedAt: schema.leads.assignedAt, stageEnteredAt: schema.leads.stageEnteredAt }).from(schema.leads).where(and(eq(schema.leads.tenantId, context.tenantId), eq(schema.leads.branchId, context.branchId!))),
  ]);
  const now = Date.now();
  const unworked = leads.filter((lead) => lead.status === "distributed" && lead.assignedAt && now - lead.assignedAt.getTime() > 15 * 60 * 1000).length;
  const stalled = leads.filter((lead) => (activeLeadStatuses as readonly string[]).includes(lead.status) && now - lead.stageEnteredAt.getTime() > 3 * 24 * 60 * 60 * 1000).length;
  return { teamSize: members.length, activeMembers: members.filter((member) => member.status === "active").length, leadsTotal: leads.length, newLeads: leads.filter((lead) => lead.status === "new").length, inContact: leads.filter((lead) => lead.status === "in_contact").length, unassigned: leads.filter((lead) => !lead.corretorId).length, unworked, stalled };
}

export type DirectorDashboardData = {
  user: { name: string; email: string; image: string | null };
  tenant: { name: string; slug: string; legalName: string | null; cnpj: string | null; subscriptionPlan: string };
  totals: { leads: number; activeLeads: number; converted: number; branches: number; members: number; activeBrokers: number; unworked: number; stalled: number };
  funnel: Array<{ stage: string; volume: number }>;
  branches: Array<{ name: string; leads: number; activeLeads: number; conversion: string }>;
};

export async function getDirectorDashboardData(): Promise<DirectorDashboardData> {
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const [user, tenant, leads, branches, members] = await Promise.all([
    db.select({ name: schema.user.name, email: schema.user.email, image: schema.user.image }).from(schema.user).where(eq(schema.user.id, context.userId)).limit(1),
    db.select({ name: schema.tenants.name, slug: schema.tenants.slug, legalName: schema.tenants.legalName, cnpj: schema.tenants.cnpj, subscriptionPlan: schema.tenants.subscriptionPlan }).from(schema.tenants).where(eq(schema.tenants.id, context.tenantId)).limit(1),
    db.select({ status: schema.leads.status, branchId: schema.leads.branchId, assignedAt: schema.leads.assignedAt, stageEnteredAt: schema.leads.stageEnteredAt }).from(schema.leads).where(eq(schema.leads.tenantId, context.tenantId)),
    db.select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).where(eq(schema.branches.tenantId, context.tenantId)),
    db.select({ role: schema.tenantMemberships.role, status: schema.tenantMemberships.status }).from(schema.tenantMemberships).where(eq(schema.tenantMemberships.tenantId, context.tenantId)),
  ]);
  if (!user[0] || !tenant[0]) throw new Error("User or tenant not found");
  const active = leads.filter((lead) => (activeLeadStatuses as readonly string[]).includes(lead.status));
  const now = Date.now();
  const unworked = leads.filter((lead) => lead.status === "distributed" && lead.assignedAt && now - lead.assignedAt.getTime() > 15 * 60 * 1000).length;
  const stalled = leads.filter((lead) => (activeLeadStatuses as readonly string[]).includes(lead.status) && now - lead.stageEnteredAt.getTime() > 3 * 24 * 60 * 60 * 1000).length;
  const stage = (status: string) => status === "new" || status === "distributed" ? "Novo" : status === "in_contact" ? "Contato" : status === "quote_sent" ? "Cotação" : status === "negotiation" ? "Negociação" : status === "converted" ? "Conversão" : "Em análise";
  const stageNames = ["Novo", "Contato", "Cotação", "Negociação", "Conversão"];
  const funnel = stageNames.map((name) => ({ stage: name, volume: leads.filter((lead) => stage(lead.status) === name).length }));
  return { user: user[0], tenant: tenant[0], totals: { leads: leads.length, activeLeads: active.length, converted: leads.filter((lead) => lead.status === "converted").length, branches: branches.length, members: members.length, activeBrokers: members.filter((member) => member.role === "broker" && member.status === "active").length, unworked, stalled }, funnel, branches: branches.map((branch) => { const branchLeads = leads.filter((lead) => lead.branchId === branch.id); const converted = branchLeads.filter((lead) => lead.status === "converted").length; return { name: branch.name, leads: branchLeads.length, activeLeads: branchLeads.filter((lead) => (activeLeadStatuses as readonly string[]).includes(lead.status)).length, conversion: branchLeads.length ? `${((converted / branchLeads.length) * 100).toFixed(1)}%` : "0,0%" }; }) };
}
