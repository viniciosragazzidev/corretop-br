import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPathPrefixes = ["/dashboard", "/equipe", "/leads", "/roadmap", "/cotacoes", "/documentos", "/clientes", "/metas", "/relatorios", "/integridade", "/catalogo", "/assinatura", "/minha-fila", "/minha-meta", "/notificacoes", "/filiais", "/financeiro", "/configuracoes", "/diretor", "/gestor", "/corretor", "/super-admin"] as const;
const authPaths = ["/login", "/verify", "/admin/login"] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("better-auth.session_token")
    ?? request.cookies.get("__Secure-better-auth.session_token")
    ?? request.cookies.get("better-auth.session_token.value");

  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (session) {
      return NextResponse.redirect(new URL(pathname.startsWith("/admin") ? "/super-admin" : "/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL(pathname.startsWith("/super-admin") ? "/admin/login" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
