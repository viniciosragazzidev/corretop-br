"use server";

import { eq } from "drizzle-orm";
import { getDatabase, schema } from "@/shared/db";
import { getAuth } from "@/shared/auth";
import { headers } from "next/headers";
import type { TenantRole } from "@/shared/db/schema";

const ROLE_REDIRECT: Record<TenantRole, string> = {
  director: "/dashboard",
  manager: "/dashboard",
  broker: "/dashboard",
};

const ROLE_LABELS: Record<TenantRole, string> = {
  director: "Diretor",
  manager: "Gestor",
  broker: "Corretor",
};

export type UserDisplayInfo = {
  name: string;
  role: string | null;
  roleKey: TenantRole | null;
  redirectLogout: string;
};

export async function getRoleRedirect(): Promise<string> {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) return "/login";

  const [membership] = await getDatabase()
    .select({ role: schema.tenantMemberships.role })
    .from(schema.tenantMemberships)
    .where(eq(schema.tenantMemberships.userId, session.user.id))
    .limit(1);

  if (!membership) return "/login";

  return ROLE_REDIRECT[membership.role] ?? "/corretor/resumo";
}

export async function getUserDisplayInfo(): Promise<UserDisplayInfo> {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { name: "Usuário", role: null, roleKey: null, redirectLogout: "/login" };
  }

  const [membership] = await getDatabase()
    .select({ role: schema.tenantMemberships.role })
    .from(schema.tenantMemberships)
    .where(eq(schema.tenantMemberships.userId, session.user.id))
    .limit(1);

  const role = membership?.role ?? null;
  const redirectLogout = role ? ROLE_REDIRECT[role] ?? "/login" : "/login";

  return {
    name: session.user.name,
    role: role ? ROLE_LABELS[role] ?? role : null,
    roleKey: role,
    redirectLogout,
  };
}
