export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formatPhoneForWhatsApp(phone)}?text=${encoded}`;
}

export function buildQuoteSummary(quote: {
  leadName: string;
  totalMonthly?: number | null;
  beneficiaryCount?: number | null;
  publicToken: string;
}): string {
  const lines = [
    `Proposta para ${quote.leadName}`,
    "",
  ];

  if (quote.beneficiaryCount) {
    lines.push(`${quote.beneficiaryCount} beneficiário(s)`);
  }

  if (quote.totalMonthly) {
    lines.push(`Valor mensal: ${formatCurrency(quote.totalMonthly)}`);
  }

  lines.push("");
  lines.push(`Veja a proposta completa:`);

  return lines.join("\n");
}

export function buildQuoteWhatsAppMessage(quote: {
  leadName: string;
  totalMonthly?: number | null;
  beneficiaryCount?: number | null;
  publicToken: string;
  baseUrl?: string;
}): string {
  const baseUrl = quote.baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const proposalUrl = `${baseUrl}/cotacao/${quote.publicToken}`;

  const lines = [
    `Olá ${quote.leadName}!`,
    "",
    `Preparamos uma proposta personalizada para você.`,
  ];

  if (quote.beneficiaryCount) {
    lines.push(`Beneficiários: ${quote.beneficiaryCount}`);
  }

  if (quote.totalMonthly) {
    lines.push(`Valor mensal: ${formatCurrency(quote.totalMonthly)}`);
  }

  lines.push("");
  lines.push(`Acesse aqui para ver todos os detalhes:`);
  lines.push(proposalUrl);

  return lines.join("\n");
}
