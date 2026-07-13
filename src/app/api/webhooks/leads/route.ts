import { POST as tenantScopedPost } from "./[tenantId]/route";
import type { NextRequest } from "next/server";

/**
 * Endpoint unificado: o tenant/filial são resolvidos pelo token.
 * A rota legada /api/webhooks/leads/:tenantId continua disponível para integrações existentes.
 */
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return tenantScopedPost(request, { params: Promise.resolve({ tenantId: "" }) });
}
