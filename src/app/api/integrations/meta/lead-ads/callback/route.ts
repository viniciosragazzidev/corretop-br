import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireCentralMetaLeadAdsManager } from "@/shared/auth/authorization";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { encryptMetaPageToken, exchangeMetaLeadAdsCode, getMetaLeadAdsConfig, getMetaLeadAdsPages, subscribeMetaPageToLeadgen, verifyMetaLeadAdsState } from "@/features/marketing/meta-lead-ads";
import { getSystemSetting } from "@/features/system-settings/queries";

export const dynamic = "force-dynamic";

function settingsRedirect(status: "connected" | "error") {
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "https://corretop.vercel.app").replace(/\/$/, "");
  return new URL(`/settings?tab=integracoes&meta=${status}`, origin);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  try {
    if (!code || !state || url.searchParams.get("error")) throw new Error("A autorização da Meta foi cancelada ou não retornou um código válido.");
    if ((await getSystemSetting("feature_meta_lead_ads_enabled")) === "false") throw new Error("A captação Meta está desativada pelo Super-admin.");
    const context = requireCentralMetaLeadAdsManager(await getRequiredTenantContext());
    const config = getMetaLeadAdsConfig();
    if (!verifyMetaLeadAdsState(state, context, config)) throw new Error("A solicitação de conexão expirou. Inicie novamente pelo CRM.");
    const userAccessToken = await exchangeMetaLeadAdsCode(code);
    const pages = await getMetaLeadAdsPages(userAccessToken);
    if (!pages.length) throw new Error("A Meta não retornou nenhuma Página que possa receber Lead Ads para esta conta.");

    const db = getDatabase();
    let connected = 0;
    for (const page of pages) {
      let status: "active" | "error" = "active";
      let lastError: string | null = null;
      try { await subscribeMetaPageToLeadgen(page.id, page.accessToken); }
      catch (error) { status = "error"; lastError = (error instanceof Error ? error.message : "Não foi possível assinar o webhook leadgen.").slice(0, 240); }

      const id = randomUUID();
      const now = new Date();
      await db.transaction(async (tx) => {
        const [connection] = await tx.insert(schema.marketingConnections).values({
          id,
          tenantId: context.tenantId,
          branchId: null,
          provider: "meta",
          platform: "facebook",
          externalAccountId: page.id,
          externalPageId: page.id,
          name: page.name,
          status,
          accessTokenCiphertext: encryptMetaPageToken(page.accessToken),
          lastError,
          createdBy: context.userId,
          createdAt: now,
          updatedAt: now,
        }).onConflictDoUpdate({
          target: [schema.marketingConnections.tenantId, schema.marketingConnections.platform, schema.marketingConnections.externalAccountId],
          set: { externalPageId: page.id, name: page.name, status, accessTokenCiphertext: encryptMetaPageToken(page.accessToken), lastError, updatedAt: now },
        }).returning({ id: schema.marketingConnections.id });
        await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "marketing_connection", entidadeId: connection.id, acao: status === "active" ? "marketing_connection.oauth_connected" : "marketing_connection.oauth_subscription_failed" });
      });
      if (status === "active") connected += 1;
    }
    return NextResponse.redirect(settingsRedirect(connected ? "connected" : "error"));
  } catch {
    return NextResponse.redirect(settingsRedirect("error"));
  }
}
