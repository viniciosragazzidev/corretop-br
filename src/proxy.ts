import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { updateSession } from "@/utils/supabase/middleware";
import { getDatabase, schema } from "@/shared/db";

const protectedPathPrefixes = ["/welcome", "/dashboard", "/equipe", "/leads", "/roadmap", "/documentos", "/clientes", "/metas", "/relatorios", "/integridade", "/catalogo", "/assinatura", "/minha-fila", "/minha-meta", "/notificacoes", "/filiais", "/financeiro", "/configuracoes", "/diretor", "/gestor", "/corretor", "/super-admin", "/checklist", "/materiais-divulgacao", "/marketing"] as const;
const publicPaths = ["/compartilhado", "/api/public"] as const;
const authPaths = ["/login", "/verify", "/admin/login"] as const;

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
}

async function isBrokerOnboardingCompleted(userId: string): Promise<boolean> {
  try {
    const db = getDatabase();
    const [membership] = await db
      .select({ role: schema.tenantMemberships.role })
      .from(schema.tenantMemberships)
      .where(eq(schema.tenantMemberships.userId, userId))
      .limit(1);

    if (!membership || membership.role !== "broker") {
      return true;
    }

    const [onboarding] = await db
      .select({ status: schema.userOnboarding.status })
      .from(schema.userOnboarding)
      .where(
        and(
          eq(schema.userOnboarding.userId, userId),
          eq(schema.userOnboarding.status, "COMPLETED")
        )
      )
      .limit(1);

    return !!onboarding;
  } catch (e) {
    console.error("Error checking onboarding status:", e);
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  request.headers.set("x-request-id", requestId);
  request.headers.set("x-pathname", pathname);
  const supabaseResponse = await updateSession(request);
  const session = request.cookies.get("better-auth.session_token")
    ?? request.cookies.get("__Secure-better-auth.session_token")
    ?? request.cookies.get("better-auth.session_token.value");

  let userId: string | null = null;
  if (session?.value) {
    try {
      const [dbSession] = await getDatabase()
        .select({ userId: schema.session.userId })
        .from(schema.session)
        .where(eq(schema.session.token, session.value))
        .limit(1);
      if (dbSession) {
        userId = dbSession.userId;
      }
    } catch (e) {
      console.error("Error fetching session from DB in proxy.ts:", e);
    }
  }

  if (userId) {
    const onboardingDone = await isBrokerOnboardingCompleted(userId);
    if (!onboardingDone && !pathname.startsWith("/onboarding") && !pathname.startsWith("/primeiro-acesso") && !pathname.startsWith("/login") && !pathname.startsWith("/api/auth")) {
      const response = NextResponse.redirect(new URL("/onboarding", request.url));
      copyCookies(supabaseResponse, response);
      response.headers.set("x-request-id", requestId);
      return response;
    }
    if (onboardingDone && (pathname.startsWith("/primeiro-acesso") || pathname.startsWith("/onboarding"))) {
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      copyCookies(supabaseResponse, response);
      response.headers.set("x-request-id", requestId);
      return response;
    }
  }

  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (session) {
      const response = NextResponse.redirect(new URL(pathname.startsWith("/admin") ? "/super-admin" : "/dashboard", request.url));
      copyCookies(supabaseResponse, response);
      response.headers.set("x-request-id", requestId);
      return response;
    }
    const response = supabaseResponse;
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Public paths bypass auth entirely
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    const response = supabaseResponse;
    response.headers.set("x-request-id", requestId);
    return response;
  }

  if (!protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const response = supabaseResponse;
    response.headers.set("x-request-id", requestId);
    return response;
  }

  if (!session) {
    const response = NextResponse.redirect(new URL(pathname.startsWith("/super-admin") ? "/admin/login" : "/login", request.url));
    copyCookies(supabaseResponse, response);
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const response = supabaseResponse;
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
