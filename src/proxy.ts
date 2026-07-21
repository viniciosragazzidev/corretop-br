import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { updateSession } from "@/utils/supabase/middleware";

const protectedPathPrefixes = ["/welcome", "/dashboard", "/equipe", "/leads", "/roadmap", "/documentos", "/clientes", "/metas", "/relatorios", "/integridade", "/catalogo", "/assinatura", "/minha-fila", "/minha-meta", "/notificacoes", "/filiais", "/financeiro", "/configuracoes", "/diretor", "/gestor", "/corretor", "/super-admin", "/checklist", "/materiais-divulgacao", "/marketing"] as const;
const publicPaths = ["/compartilhado", "/api/public"] as const;
const authPaths = ["/login", "/verify", "/admin/login"] as const;

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  request.headers.set("x-request-id", requestId);
  const supabaseResponse = await updateSession(request);
  const session = request.cookies.get("better-auth.session_token")
    ?? request.cookies.get("__Secure-better-auth.session_token")
    ?? request.cookies.get("better-auth.session_token.value");

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
