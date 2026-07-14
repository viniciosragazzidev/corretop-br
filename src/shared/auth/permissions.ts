import type { TenantRole } from "@/shared/db/schema";

export const PERMISSIONS = {
  criar_lead_manual: ["broker", "manager", "director"],
  ver_dashboard_equipe: ["manager", "director"],
  ver_dashboard_pessoal: ["broker"],
  convidar_gestor: ["director"],
  convidar_corretor: ["director", "manager"],
  gerenciar_filiais: ["director"],
  ver_painel_integridade: ["manager", "director"],
  ver_comissao_propria: ["broker", "manager", "director"],
  ver_comissao_equipe: ["manager", "director"],
  gerenciar_comissoes: ["director"],
  gerenciar_metas: ["director", "manager"],
  ver_meta_propria: ["broker"],
  ver_meta_equipe: ["manager", "director"],
  exportar_relatorios: ["manager", "director"],
  aprovar_documentos: ["manager", "director"],
  configurar_white_label: ["director"],
  alterar_status_lead: ["broker", "manager", "director"],
  reabrir_lead_perdido: ["manager", "director"],
} as const satisfies Record<string, readonly TenantRole[]>;

export type PermissionKey = keyof typeof PERMISSIONS;

export function hasPermission(role: TenantRole | string | null | undefined, permission: PermissionKey) {
  return role != null && (PERMISSIONS[permission] as readonly string[]).includes(role);
}
