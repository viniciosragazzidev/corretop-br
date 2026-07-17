import { type NextRequest, NextResponse } from "next/server";

import {
  extractBearerToken,
  readWebhookJson,
  resolveRequestId,
} from "@/features/leads/webhooks/utils/lead-webhook.utils";
import { receiveLeadWebhook } from "@/features/leads/webhooks/services/receive-lead-webhook";

export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key, X-Request-Id",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const receivedAt = new Date();
  const requestId = resolveRequestId(request.headers.get("X-Request-Id"));

  // Build response headers
  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
  };

  // ── Validate Content-Type ──────────────────────────────────────────
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "O Content-Type deve ser application/json.",
        },
      },
      { status: 415, headers },
    );
  }

  // ── Extract Bearer token ───────────────────────────────────────────
  const rawToken = extractBearerToken(request.headers.get("Authorization"));
  if (!rawToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Credenciais inválidas.",
        },
      },
      { status: 401, headers },
    );
  }

  // ── Read and validate body size ────────────────────────────────────
  const bodyResult = await readWebhookJson(request);

  if (!bodyResult.ok) {
    if (bodyResult.code === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "O payload excede o limite de 32 KB.",
          },
        },
        { status: 413, headers },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "O corpo da requisição deve conter JSON válido.",
        },
      },
      { status: 400, headers },
    );
  }

  // ── Extract optional Idempotency-Key ───────────────────────────────
  const rawIdempotencyKey = request.headers.get("Idempotency-Key");
  const idempotencyKey =
    rawIdempotencyKey && /^[a-zA-Z0-9_-]{1,64}$/.test(rawIdempotencyKey)
      ? rawIdempotencyKey
      : null;

  // ── Process ────────────────────────────────────────────────────────
  const result = await receiveLeadWebhook({
    pathTenantId: tenantId,
    rawToken,
    payload: bodyResult.data,
    idempotencyKey,
    requestMetadata: {
      requestId,
      userAgent: request.headers.get("User-Agent"),
      receivedAt,
    },
  });

  // ── Map result to HTTP response ────────────────────────────────────
  if (!result.success) {
    switch (result.code) {
      case "UNAUTHORIZED":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Credenciais inválidas.",
            },
          },
          { status: 401, headers },
        );

      case "TENANT_INACTIVE":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ACCESS_DENIED",
              message: "Integração indisponível.",
            },
          },
          { status: 403, headers },
        );

      case "INVALID_PAYLOAD":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_PAYLOAD",
              message: "Os dados enviados são inválidos.",
              issues: result.issues ?? [],
            },
          },
          { status: 422, headers },
        );

      case "BRANCH_NOT_FOUND":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "BRANCH_NOT_FOUND",
              message: "A filial informada não está disponível.",
            },
          },
          { status: 422, headers },
        );

      case "IDEMPOTENCY_CONFLICT":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "IDEMPOTENCY_CONFLICT",
              message:
                "A chave de idempotência já foi utilizada com outro conteúdo.",
            },
          },
          { status: 409, headers },
        );

      case "PAYLOAD_TOO_LARGE":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "O payload excede o limite de 32 KB.",
            },
          },
          { status: 413, headers },
        );

      case "RATE_LIMITED":
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Limite de requisições excedido. Tente novamente mais tarde.",
            },
          },
          { status: 429, headers },
        );

      case "INTERNAL_ERROR":
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Não foi possível processar a requisição.",
            },
          },
          { status: 500, headers },
        );
    }
  }

  // Success
  const status = result.duplicate ? 200 : 201;
  return NextResponse.json(
    {
      success: true,
      data: {
        leadId: result.leadId,
        duplicate: result.duplicate,
      },
    },
    { status, headers },
  );
}
