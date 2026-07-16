export const notificationCapabilities = [
  { id: "lead_assignment", label: "Lead atribuído ou reatribuído", description: "Aviso ao corretor, gestor e diretor quando um lead é distribuído.", channels: "Toast + push" },
  { id: "lead_feedback_overdue", label: "Lead devolvido por SLA", description: "Aviso quando o primeiro contato não acontece dentro do prazo.", channels: "Toast/in-app" },
  { id: "lead_feedback_reminder", label: "Lembrete de feedback", description: "Lembrete recorrente com intervalo configurável para registrar o andamento do atendimento.", channels: "Toast + push" },
  { id: "lead_sla", label: "Alertas de SLA e estagnação", description: "Alertas de lead não trabalhado ou parado na etapa.", channels: "Toast/in-app" },
  { id: "lead_service_started", label: "Atendimento iniciado", description: "Aviso para a gestão quando o corretor inicia um atendimento.", channels: "Toast/in-app" },
  { id: "sale_registered", label: "Venda registrada", description: "Confirmação de conversão e registro da venda.", channels: "Toast/in-app" },
  { id: "client_renewal", label: "Renovação de cliente", description: "Lembretes de aniversário e renovação contratual.", channels: "Toast/in-app" },
  { id: "lead_reengagement", label: "Reengajamento de lead", description: "Avisos de oportunidades de reengajamento.", channels: "Toast/in-app" },
  { id: "lead_converted", label: "Lead convertido", description: "Aviso de mudança do lead para convertido.", channels: "Toast/in-app" },
] as const;

export type NotificationCapabilityId = (typeof notificationCapabilities)[number]["id"];

export function notificationCapabilitySettingKey(id: NotificationCapabilityId) {
  return `notification_capability_${id}_enabled`;
}
