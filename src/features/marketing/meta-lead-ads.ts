import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { encryptChannelSecret, decryptChannelSecret } from "@/features/communication-channels/secret-crypto";
import type { TenantContext } from "@/shared/auth/types";

const GRAPH_VERSION_PATTERN = /^v\d+\.\d+$/;
const STATE_TTL_MS = 10 * 60 * 1000;

type MetaLeadAdsConfig = {
  appId: string;
  appSecret: string;
  tokenEncryptionKey: string;
  redirectUri: string;
  graphVersion: string;
};

type SignedState = { tenantId: string; userId: string; issuedAt: number };

export type MetaPageAccount = { id: string; name: string; accessToken: string; category?: string };

export function getMetaLeadAdsConfig(): MetaLeadAdsConfig {
  const appId = process.env.META_LEAD_ADS_APP_ID?.trim() || process.env.META_WHATSAPP_APP_ID?.trim();
  const appSecret = process.env.META_LEAD_ADS_APP_SECRET?.trim() || process.env.META_WHATSAPP_APP_SECRET?.trim();
  const tokenEncryptionKey = process.env.META_LEAD_ADS_TOKEN_ENCRYPTION_KEY?.trim() || process.env.META_WHATSAPP_TOKEN_ENCRYPTION_KEY?.trim();
  const redirectUri = process.env.META_LEAD_ADS_REDIRECT_URI?.trim() || `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")}/api/integrations/meta/lead-ads/callback`;
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v25.0";
  const missing = [!appId && "META_LEAD_ADS_APP_ID", !appSecret && "META_LEAD_ADS_APP_SECRET", !tokenEncryptionKey && "META_LEAD_ADS_TOKEN_ENCRYPTION_KEY", !redirectUri.startsWith("http") && "META_LEAD_ADS_REDIRECT_URI"].filter(Boolean);
  if (missing.length) throw new Error(`Configuração Meta Lead Ads incompleta: ${missing.join(", ")}.`);
  if (!GRAPH_VERSION_PATTERN.test(graphVersion)) throw new Error("META_GRAPH_API_VERSION inválida.");
  return { appId: appId!, appSecret: appSecret!, tokenEncryptionKey: tokenEncryptionKey!, redirectUri, graphVersion };
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function createState(context: TenantContext, config: MetaLeadAdsConfig) {
  const payload = Buffer.from(JSON.stringify({ tenantId: context.tenantId, userId: context.userId, issuedAt: Date.now() } satisfies SignedState)).toString("base64url");
  return `${payload}.${sign(payload, config.appSecret)}`;
}

export function verifyMetaLeadAdsState(state: string, context: TenantContext, config = getMetaLeadAdsConfig()) {
  const [payload, receivedSignature] = state.split(".");
  if (!payload || !receivedSignature) return false;
  const expectedSignature = sign(payload, config.appSecret);
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedState;
    return parsed.tenantId === context.tenantId && parsed.userId === context.userId && Number.isFinite(parsed.issuedAt) && Date.now() - parsed.issuedAt >= 0 && Date.now() - parsed.issuedAt <= STATE_TTL_MS;
  } catch { return false; }
}

export function getMetaLeadAdsAuthorizationUrl(context: TenantContext) {
  const config = getMetaLeadAdsConfig();
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", createState(context, config));
  url.searchParams.set("scope", "pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval");
  return url.toString();
}

type MetaApiError = { error?: { message?: string } };

async function metaFetch<T>(path: string, init: RequestInit, accessToken?: string) {
  const config = getMetaLeadAdsConfig();
  const response = await fetch(`https://graph.facebook.com/${config.graphVersion}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: { Accept: "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => ({})) as T & MetaApiError;
  if (!response.ok) throw new Error(payload.error?.message ?? "A Meta recusou a solicitação.");
  return payload;
}

export async function exchangeMetaLeadAdsCode(code: string) {
  const config = getMetaLeadAdsConfig();
  const url = new URL(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("code", code);
  const payload = await metaFetch<{ access_token?: string }>(url.toString().replace(`https://graph.facebook.com/${config.graphVersion}/`, ""), { method: "GET" });
  if (!payload.access_token) throw new Error("A Meta não devolveu um token de autorização.");
  return payload.access_token;
}

export async function getMetaLeadAdsPages(userAccessToken: string): Promise<MetaPageAccount[]> {
  const payload = await metaFetch<{ data?: Array<{ id?: string; name?: string; access_token?: string; category?: string }> }>("me/accounts?fields=id,name,access_token,category&limit=100", { method: "GET" }, userAccessToken);
  return (payload.data ?? []).flatMap((page) => page.id && page.name && page.access_token ? [{ id: page.id, name: page.name, accessToken: page.access_token, category: page.category }] : []);
}

export async function subscribeMetaPageToLeadgen(pageId: string, pageAccessToken: string) {
  return metaFetch<{ success?: boolean }>(`${encodeURIComponent(pageId)}/subscribed_apps`, { method: "POST", headers: { "Content-Type": "application/json" }, body: new URLSearchParams({ subscribed_fields: "leadgen" }) }, pageAccessToken);
}

export function encryptMetaPageToken(accessToken: string) {
  return encryptChannelSecret(accessToken, getMetaLeadAdsConfig().tokenEncryptionKey);
}

export function decryptMetaPageToken(ciphertext: string) {
  return decryptChannelSecret(ciphertext, getMetaLeadAdsConfig().tokenEncryptionKey);
}

export async function fetchMetaLead(leadgenId: string, pageAccessToken: string) {
  return metaFetch<{ id: string; created_time?: string; field_data?: Array<{ name?: string; values?: string[] }>; ad_id?: string; adset_id?: string; campaign_id?: string; form_id?: string }>(`${encodeURIComponent(leadgenId)}?fields=id,created_time,field_data,ad_id,adset_id,campaign_id,form_id`, { method: "GET" }, pageAccessToken);
}
