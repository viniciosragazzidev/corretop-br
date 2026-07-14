import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";

import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export async function GET(request: NextRequest) {
  try {
    const context = await getRequiredTenantContext();
    const key = request.nextUrl.searchParams.get("key") ?? "";
    const safeKey = normalize(key).replaceAll("\\", "/");
    if (!safeKey || safeKey.includes("..") || !safeKey.startsWith(`${context.tenantId}/`)) {
      return NextResponse.json({ error: "Documento inválido." }, { status: 400 });
    }

    const fileUrl = `/api/documents/download?key=${encodeURIComponent(key)}`;
    const [document] = await getDatabase()
      .select({ filename: schema.leadDocuments.filename, fileUrl: schema.leadDocuments.fileUrl })
      .from(schema.leadDocuments)
      .where(and(eq(schema.leadDocuments.tenantId, context.tenantId), eq(schema.leadDocuments.fileUrl, fileUrl)))
      .limit(1);
    if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

    const file = await readFile(join(process.cwd(), ".data", "uploads", safeKey));
    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `inline; filename="${document.filename.replaceAll('"', "")}"`,
        "Cache-Control": "private, no-store",
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível abrir o documento." }, { status: 404 });
  }
}
