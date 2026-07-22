import "server-only";

export const META_WHATSAPP_TEMPLATE_PURPOSES = {
  brokerInvitation: { name: "broker_first_access", language: "pt_BR" },
  taskReminder: { name: "corretop_lembrete_tarefa", language: "pt_BR" },
  clientNotice: { name: "corretop_aviso_cliente", language: "pt_BR" },
} as const;

export type MetaWhatsAppTemplatePurpose = keyof typeof META_WHATSAPP_TEMPLATE_PURPOSES;

export function getMetaWhatsAppTemplate(purpose: string) {
  if (!(purpose in META_WHATSAPP_TEMPLATE_PURPOSES)) return null;
  return META_WHATSAPP_TEMPLATE_PURPOSES[purpose as MetaWhatsAppTemplatePurpose];
}
