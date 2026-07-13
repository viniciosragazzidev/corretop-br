import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDatabase, schema } from "@/shared/db";
import { getOpenWaContact } from "@/lib/integrations/openwa";

type OpenWaPayload = { id?: string; messageId?: string; from?: string; to?: string; sender?: string; recipient?: string; chatId?: string; body?: string; text?: string; timestamp?: number; direction?: string; fromMe?: boolean; data?: OpenWaPayload; content?: { text?: string; body?: string }; message?: { text?: string; body?: string } };

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const raw = await request.text();
  let payload: OpenWaPayload;
  try { payload = JSON.parse(raw) as OpenWaPayload; } catch { return NextResponse.json({ accepted: true, discarded: true }); }
  const sessionId = String((payload as OpenWaPayload & { sessionId?: string }).sessionId ?? (payload.data as (OpenWaPayload & { sessionId?: string }) | undefined)?.sessionId ?? "");
  const db = getDatabase();
  const [connection] = await db.select({ secret: schema.whatsappConnections.webhookSecret, active: schema.whatsappConnections.chatInternoAtivo, sessionId: schema.whatsappConnections.sessionId, userId: schema.whatsappConnections.userId }).from(schema.whatsappConnections).where(and(eq(schema.whatsappConnections.tenantId, tenantId), ...(sessionId ? [eq(schema.whatsappConnections.sessionId, sessionId)] : []))).limit(1);
  if (!connection?.active) return NextResponse.json({ accepted: true, discarded: true });
  const effectiveSessionId = sessionId || connection.sessionId || "";
  if (connection.secret) {
    const provided = request.headers.get("x-openwa-signature") ?? request.headers.get("x-signature") ?? "";
    const expected = createHmac("sha256", connection.secret).update(raw).digest("hex");
    const left = Buffer.from(provided.replace(/^sha256=/, ""));
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return NextResponse.json({ accepted: false, error: "Invalid signature" }, { status: 401 });
  }
  const event = payload.data ?? payload;
  console.info("[OpenWA] mensagem recebida", JSON.stringify({ event: (payload as OpenWaPayload & { event?: string }).event ?? "unknown", id: event.id ?? event.messageId ?? null, from: event.from ?? event.sender ?? null, to: event.to ?? event.recipient ?? null, chatId: event.chatId ?? null, body: event.body ?? event.text ?? event.content?.body ?? event.content?.text ?? event.message?.body ?? event.message?.text ?? null, fromMe: event.fromMe ?? false }));
  let address = event.fromMe ? (event.to ?? event.recipient ?? event.chatId ?? event.from ?? event.sender) : (event.from ?? event.sender ?? event.chatId ?? event.to ?? event.recipient);
  if (typeof address === "string" && address.endsWith("@lid") && effectiveSessionId) {
    const contact = await getOpenWaContact(effectiveSessionId, address);
    address = contact?.id ?? contact?.number ?? address;
    console.info("[OpenWA] LID resolvido", JSON.stringify({ lid: event.from ?? event.chatId, canonical: address }));
  }
  const phone = String(address ?? "").replace(/\D/g, "");
  const body = String(event.body ?? event.text ?? event.content?.body ?? event.content?.text ?? event.message?.body ?? event.message?.text ?? "").trim();
  if (!phone || !body) { console.info("[OpenWA] mensagem descartada: payload sem telefone ou corpo", JSON.stringify({ phone, body })); return NextResponse.json({ accepted: true, discarded: true }); }
  const [leads, clients] = await Promise.all([
    db.select({ id: schema.leads.id, phone: schema.leads.telefone, status: schema.leads.status }).from(schema.leads).where(eq(schema.leads.tenantId, tenantId)),
    db.select({ id: schema.clients.id, phone: schema.clients.telefone }).from(schema.clients).where(eq(schema.clients.tenantId, tenantId)),
  ]);
  const samePhone = (value: string) => { const candidate = value.replace(/\D/g, ""); return candidate === phone || candidate.endsWith(phone) || phone.endsWith(candidate) || candidate.slice(-11) === phone.slice(-11); };
  const matchingLeads = leads.filter((item) => samePhone(item.phone));
  const lead = matchingLeads.find((item) => ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(item.status)) ?? matchingLeads[0];
  const client = clients.find((item) => samePhone(item.phone));
  if (!lead && !client) { console.info("[OpenWA] mensagem descartada: contato não vinculado", JSON.stringify({ phone, tenantId })); return NextResponse.json({ accepted: true, discarded: true }); }
  await db.insert(schema.whatsappMessages).values({ id: randomUUID(), tenantId, leadId: lead?.id ?? null, clientId: client?.id ?? null, messageId: event.id ?? event.messageId ?? null, phone, direction: event.direction === "outgoing" || event.fromMe === true ? "outgoing" : "incoming", body, sentAt: event.timestamp ? new Date(event.timestamp * 1000) : new Date() }).onConflictDoNothing({ target: [schema.whatsappMessages.tenantId, schema.whatsappMessages.messageId] });
  if (lead?.id) revalidatePath(`/leads/${lead.id}`);
  console.info("[OpenWA] mensagem persistida", JSON.stringify({ leadId: lead?.id ?? null, clientId: client?.id ?? null, phone, direction: event.direction === "outgoing" || event.fromMe === true ? "outgoing" : "incoming" }));
  return NextResponse.json({ accepted: true, persisted: true });
}
