import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";
import { getSystemSetting } from "@/features/system-settings/queries";

const FEATURE = "feature_meta_lead_ads_enabled";

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.META_WHATSAPP_APP_SECRET?.trim();
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signature.slice("sha256=".length);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_LEAD_WEBHOOK_VERIFY_TOKEN?.trim();
  if (mode === "subscribe" && expected && token === expected && challenge) return new Response(challenge, { status: 200 });
  return Response.json({ error: "Webhook não autorizado." }, { status: 403 });
}

export async function POST(request: Request) {
  if ((await getSystemSetting(FEATURE)) === "false") return Response.json({ received: false }, { status: 404 });
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("x-hub-signature-256"))) return Response.json({ error: "Assinatura inválida." }, { status: 401 });

  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return Response.json({ error: "Payload inválido." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return Response.json({ error: "Payload inválido." }, { status: 400 });

  const body = payload as { entry?: Array<{ id?: string; changes?: Array<{ field?: string; value?: { leadgen_id?: string; form_id?: string; ad_id?: string; adgroup_id?: string; campaign_id?: string } }> }> };
  const db = getDatabase();
  const now = new Date();
  let stored = 0;
  for (const entry of body.entry ?? []) {
    const pageId = entry.id;
    if (!pageId) continue;
    const [connection] = await db.select({ id: schema.marketingConnections.id }).from(schema.marketingConnections).where(eq(schema.marketingConnections.externalPageId, pageId)).limit(1);
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen" || !change.value?.leadgen_id) continue;
      const externalEventId = `leadgen:${change.value.leadgen_id}`;
      const payloadHash = createHash("sha256").update(JSON.stringify(change.value)).digest("hex");
      await db.insert(schema.marketingWebhookEvents).values({
        id: randomUUID(), connectionId: connection?.id ?? null, provider: "meta", eventType: "leadgen", externalEventId, payloadHash, payload: change.value, status: connection ? "received" : "failed", errorMessage: connection ? null : "Nenhuma conexão ativa vinculada à Página.", receivedAt: now,
      }).onConflictDoNothing({ target: [schema.marketingWebhookEvents.provider, schema.marketingWebhookEvents.externalEventId] });
      stored += 1;
    }
    if (connection) await db.update(schema.marketingConnections).set({ lastWebhookAt: now, updatedAt: now }).where(eq(schema.marketingConnections.id, connection.id));
  }
  return Response.json({ received: true, stored });
}
