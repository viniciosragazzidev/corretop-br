"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPlatformTenant, createTenantAccess, setPlatformTenantStatus } from "@/features/platform-admin/service";

export async function createTenantAction(formData: FormData) {
  const tenantId = await createPlatformTenant(Object.fromEntries(formData));
  revalidatePath("/super-admin");
  redirect(`/super-admin/tenants/${tenantId}`);
}

export async function setTenantStatusAction(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "active" && status !== "inactive") throw new Error("Status inválido.");
  await setPlatformTenantStatus(tenantId, status);
  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/tenants/${tenantId}`);
}

export async function createTenantAccessAction(formData: FormData) {
  await createTenantAccess(Object.fromEntries(formData));
  const tenantId = String(formData.get("tenantId") ?? "");
  revalidatePath(`/super-admin/tenants/${tenantId}`);
}
