import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const tenantContext = await getRequiredTenantContext();
  const db = getDatabase();
  const [quote] = await db.select({ id: schema.quotes.id, tenantId: schema.quotes.tenantId, leadName: schema.leads.nome, corretorId: schema.leads.corretorId, branchId: schema.leads.branchId, brokerName: schema.user.name, brokerImage: schema.user.image, tenantName: schema.tenants.name, brandColor: schema.tenants.brandColor, logoUrl: schema.tenants.logoUrl })
    .from(schema.quotes).innerJoin(schema.leads, eq(schema.quotes.leadId, schema.leads.id)).leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id)).innerJoin(schema.tenants, eq(schema.quotes.tenantId, schema.tenants.id))
    .where(and(eq(schema.quotes.id, id), eq(schema.quotes.tenantId, tenantContext.tenantId))).limit(1);
  if (!quote || (tenantContext.role === "broker" && quote.corretorId !== tenantContext.userId) || (tenantContext.role === "manager" && (!tenantContext.branchId || quote.branchId !== tenantContext.branchId))) return new Response("Não encontrado", { status: 404 });
  const items = await db.select({ planName: schema.carrierPlans.name, carrierName: schema.carriers.name, monthlyPrice: schema.quoteItems.monthlyPrice, recommended: schema.quoteItems.recommended }).from(schema.quoteItems).innerJoin(schema.carrierPlans, eq(schema.quoteItems.planId, schema.carrierPlans.id)).innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id)).where(eq(schema.quoteItems.quoteId, quote.id));
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = hexToRgb(quote.brandColor ?? "#2563eb");
  const logo = await embedDataImage(pdf, quote.logoUrl);
  const brokerImage = await embedDataImage(pdf, quote.brokerImage);
  page.drawRectangle({ x: 0, y: 760, width: 595.28, height: 81.89, color: brand });
  page.drawText(quote.tenantName, { x: 42, y: 799, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Simulação de plano de saúde", { x: 42, y: 778, size: 11, font: regular, color: rgb(1, 1, 1) });
  if (logo) page.drawImage(logo, { x: 430, y: 775, width: 54, height: 32 });
  page.drawCircle({ x: 523, y: 798, size: 22, color: rgb(1, 1, 1), opacity: 0.18 });
  if (brokerImage) page.drawImage(brokerImage, { x: 503, y: 778, width: 40, height: 40 }); else page.drawText(initials(quote.brokerName ?? "CorreTop"), { x: 513, y: 793, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Cliente: ${quote.leadName}`, { x: 42, y: 718, size: 18, font: bold, color: rgb(0.1, 0.12, 0.16) });
  page.drawText(`Corretor: ${quote.brokerName ?? "Equipe CorreTop"}`, { x: 42, y: 695, size: 11, font: regular, color: rgb(0.35, 0.39, 0.45) });
  page.drawText("Planos selecionados", { x: 42, y: 646, size: 14, font: bold, color: rgb(0.1, 0.12, 0.16) });
  let y = 612;
  for (const item of items) {
    page.drawRectangle({ x: 42, y: y - 14, width: 511, height: 52, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.88, 0.9, 0.94), borderWidth: 1 });
    page.drawText(`${item.recommended ? "★ " : ""}${item.planName}`, { x: 56, y: y + 15, size: 12, font: bold, color: rgb(0.1, 0.12, 0.16) });
    page.drawText(item.carrierName, { x: 56, y: y - 2, size: 10, font: regular, color: rgb(0.35, 0.39, 0.45) });
    page.drawText(`${formatCurrency(item.monthlyPrice)}/mês`, { x: 432, y: y + 6, size: 12, font: bold, color: brand });
    y -= 67;
  }
  page.drawText("Valores referenciais sujeitos à análise e às condições vigentes das operadoras.", { x: 42, y: 96, size: 8.5, font: regular, color: rgb(0.4, 0.43, 0.48) });
  page.drawText("CorreTop · proposta gerada digitalmente", { x: 42, y: 76, size: 8.5, font: regular, color: rgb(0.4, 0.43, 0.48) });
  const bytes = await pdf.save();
  await db.insert(schema.auditLogs).values({ id: randomUUID(), userId: tenantContext.userId, entidade: "quote", entidadeId: quote.id, acao: "exportou_pdf" });
  return new Response(Uint8Array.from(bytes).buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="cotacao-${quote.leadName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf"`, "Cache-Control": "private, no-store" } });
}

function hexToRgb(hex: string) { const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#2563eb"; return rgb(parseInt(value.slice(1, 3), 16) / 255, parseInt(value.slice(3, 5), 16) / 255, parseInt(value.slice(5, 7), 16) / 255); }
function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatCurrency(value: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)); }
async function embedDataImage(pdf: PDFDocument, value: string | null): Promise<PDFImage | null> {
  if (!value?.startsWith("data:image/")) return null;
  const [header, body] = value.split(",", 2);
  if (!header || !body || !header.includes(";base64")) return null;
  try { const bytes = Buffer.from(body, "base64"); return header.startsWith("data:image/png") ? await pdf.embedPng(bytes) : header.startsWith("data:image/jpeg") ? await pdf.embedJpg(bytes) : null; } catch { return null; }
}
