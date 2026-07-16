import { redirect } from "next/navigation";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";

export default async function CatalogPage() {
  const context = await getRequiredTenantContext();
  if (context.role !== "director") redirect("/access-denied");
  redirect("/catalogo/interno");
}
