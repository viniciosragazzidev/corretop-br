import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";

export async function POST(req: NextRequest) {
  try {
    const context = await getRequiredTenantContext();
    if (!context) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uuid = randomUUID();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueFilename = `${uuid}-${safeFilename}`;

    // Define path in public/uploads
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ fileUrl, filename: file.name });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno no upload." },
      { status: 500 }
    );
  }
}
