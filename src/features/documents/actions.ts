"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

// ─── Requirements Actions ──────────────────────────────────────────────────

const requirementInput = z.object({
  carrierId: z.string().trim().nullable().optional(),
  planId: z.string().trim().nullable().optional(),
  name: z.string().trim().min(2, "Informe o nome do documento.").max(100),
  description: z.string().trim().max(250).optional(),
  required: z.coerce.boolean().optional(),
});

export type DocumentActionState = { success?: boolean; error?: string };

export async function createRequirementAction(
  _previous: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const context = await getRequiredTenantContext();
  if (context.role !== "director") return { error: "Apenas diretores podem criar requisitos." };

  const parsed = requirementInput.safeParse({
    carrierId: formData.get("carrierId") || null,
    planId: formData.get("planId") || null,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    required: formData.get("required") === "true",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const db = getDatabase();
    await db.insert(schema.documentRequirements).values({
      id: randomUUID(),
      tenantId: context.tenantId,
      carrierId: parsed.data.carrierId || null,
      planId: parsed.data.planId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      required: parsed.data.required ?? true,
    });

    revalidatePath("/documentos");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao criar requisito." };
  }
}

export async function deleteRequirementAction(
  requirementId: string
): Promise<DocumentActionState> {
  const context = await getRequiredTenantContext();
  if (context.role !== "director") return { error: "Apenas diretores podem excluir requisitos." };

  try {
    const db = getDatabase();
    const result = await db
      .delete(schema.documentRequirements)
      .where(
        and(
          eq(schema.documentRequirements.id, requirementId),
          eq(schema.documentRequirements.tenantId, context.tenantId)
        )
      )
      .returning({ id: schema.documentRequirements.id });

    if (result.length === 0) return { error: "Requisito não encontrado." };
    revalidatePath("/documentos");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao excluir requisito." };
  }
}

export async function getDocumentRequirements() {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  return db
    .select({
      id: schema.documentRequirements.id,
      name: schema.documentRequirements.name,
      description: schema.documentRequirements.description,
      required: schema.documentRequirements.required,
      carrierId: schema.documentRequirements.carrierId,
      carrierName: schema.carriers.name,
      planId: schema.documentRequirements.planId,
      planName: schema.carrierPlans.name,
    })
    .from(schema.documentRequirements)
    .leftJoin(schema.carriers, eq(schema.documentRequirements.carrierId, schema.carriers.id))
    .leftJoin(schema.carrierPlans, eq(schema.documentRequirements.planId, schema.carrierPlans.id))
    .where(eq(schema.documentRequirements.tenantId, context.tenantId))
    .orderBy(schema.documentRequirements.name);
}

// ─── Lead Documents Actions ────────────────────────────────────────────────

export async function getLeadDocuments(leadId: string) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  return db
    .select({
      id: schema.leadDocuments.id,
      filename: schema.leadDocuments.filename,
      fileUrl: schema.leadDocuments.fileUrl,
      status: schema.leadDocuments.status,
      requirementId: schema.leadDocuments.requirementId,
      requirementName: schema.documentRequirements.name,
      uploadedBy: schema.leadDocuments.uploadedBy,
      createdAt: schema.leadDocuments.createdAt,
    })
    .from(schema.leadDocuments)
    .innerJoin(schema.leads, eq(schema.leadDocuments.leadId, schema.leads.id))
    .leftJoin(schema.documentRequirements, eq(schema.leadDocuments.requirementId, schema.documentRequirements.id))
    .where(
      and(
        eq(schema.leadDocuments.leadId, leadId),
        eq(schema.leadDocuments.tenantId, context.tenantId),
        context.role === "broker"
          ? eq(schema.leads.corretorId, context.userId)
          : context.role === "manager" && context.branchId
            ? eq(schema.leads.branchId, context.branchId)
            : undefined,
      )
    )
    .orderBy(schema.leadDocuments.createdAt);
}

export async function confirmDocumentUploadAction({
  leadId,
  requirementId,
  filename,
  fileUrl,
}: {
  leadId: string;
  requirementId: string | null;
  filename: string;
  fileUrl: string;
}): Promise<DocumentActionState> {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  try {
    const [lead] = await db
      .select({ id: schema.leads.id, corretorId: schema.leads.corretorId, branchId: schema.leads.branchId })
      .from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.tenantId, context.tenantId)))
      .limit(1);
    if (!lead) return { error: "Lead não encontrado." };
    if (context.role === "broker" && lead.corretorId !== context.userId) {
      return { error: "Você não pode anexar documentos a este lead." };
    }
    if (context.role === "manager" && (!context.branchId || lead.branchId !== context.branchId)) {
      return { error: "Este lead não pertence à sua filial." };
    }
    if (requirementId) {
      const [requirement] = await db
        .select({ id: schema.documentRequirements.id })
        .from(schema.documentRequirements)
        .where(and(eq(schema.documentRequirements.id, requirementId), eq(schema.documentRequirements.tenantId, context.tenantId)))
        .limit(1);
      if (!requirement) return { error: "Requisito de documento inválido." };
    }

    const docId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(schema.leadDocuments).values({
        id: docId,
        tenantId: context.tenantId,
        leadId,
        requirementId,
        filename,
        fileUrl,
        status: "pending",
        uploadedBy: context.userId,
      });

      await tx.insert(schema.leadInteractions).values({
        id: randomUUID(),
        leadId,
        userId: context.userId,
        tipo: "document_upload",
        conteudo: `Documento "${filename}" enviado para aprovação.`,
        metadata: { docId },
      });
    });

    revalidatePath(`/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao salvar documento." };
  }
}

export async function reviewDocumentAction({
  documentId,
  leadId,
  status,
}: {
  documentId: string;
  leadId: string;
  status: "approved" | "rejected";
}): Promise<DocumentActionState> {
  const context = await getRequiredTenantContext();
  if (context.role === "broker") return { error: "Corretores não podem aprovar/rejeitar documentos." };

  const db = getDatabase();
  try {
    const [lead] = await db.select({ id: schema.leads.id, branchId: schema.leads.branchId })
      .from(schema.leads)
      .where(and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.tenantId, context.tenantId),
        context.role === "manager" && context.branchId ? eq(schema.leads.branchId, context.branchId) : undefined,
      ))
      .limit(1);
    if (!lead) return { error: "Este lead não pertence ao escopo da sua unidade." };
    await db.transaction(async (tx) => {
      const [doc] = await tx
        .update(schema.leadDocuments)
        .set({
          status,
          reviewedBy: context.userId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(schema.leadDocuments.id, documentId),
            eq(schema.leadDocuments.tenantId, context.tenantId),
            eq(schema.leadDocuments.leadId, leadId)
          )
        )
        .returning({ filename: schema.leadDocuments.filename });

      if (!doc) throw new Error("Documento não encontrado.");

      await tx.insert(schema.leadInteractions).values({
        id: randomUUID(),
        leadId,
        userId: context.userId,
        tipo: "document_review",
        conteudo: `Documento "${doc.filename}" foi ${status === "approved" ? "aprovado" : "rejeitado"}.`,
        metadata: { documentId, status },
      });
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/documentos");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao avaliar documento." };
  }
}

// ─── Approval Queue & Bulk Actions ────────────────────────────────────────

export async function getPendingDocuments() {
  const context = await getRequiredTenantContext();
  if (context.role === "broker") return [];

  const db = getDatabase();

  const query = db
    .select({
      id: schema.leadDocuments.id,
      filename: schema.leadDocuments.filename,
      fileUrl: schema.leadDocuments.fileUrl,
      status: schema.leadDocuments.status,
      createdAt: schema.leadDocuments.createdAt,
      leadId: schema.leadDocuments.leadId,
      leadNome: schema.leads.nome,
      corretorNome: schema.user.name,
      requirementName: schema.documentRequirements.name,
      branchId: schema.leads.branchId,
    })
    .from(schema.leadDocuments)
    .innerJoin(schema.leads, eq(schema.leadDocuments.leadId, schema.leads.id))
    .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
    .leftJoin(schema.documentRequirements, eq(schema.leadDocuments.requirementId, schema.documentRequirements.id))
    .where(
      and(
        eq(schema.leadDocuments.status, "pending"),
        eq(schema.leadDocuments.tenantId, context.tenantId)
      )
    )
    .orderBy(schema.leadDocuments.createdAt);

  const rows = await query;

  // Filter based on branch scope for manager
  if (context.role === "manager" && context.branchId) {
    return rows.filter((r) => r.branchId === context.branchId);
  }

  return rows;
}

export async function bulkReviewDocumentsAction(
  documentIds: string[],
  status: "approved" | "rejected"
): Promise<DocumentActionState> {
  const context = await getRequiredTenantContext();
  if (context.role === "broker") return { error: "Acesso negado." };

  if (documentIds.length === 0) return { success: true };

  const db = getDatabase();
  try {
    await db.transaction(async (tx) => {
      // Find all target documents to verify context
      const docs = await tx
        .select({ id: schema.leadDocuments.id, leadId: schema.leadDocuments.leadId, filename: schema.leadDocuments.filename, branchId: schema.leads.branchId })
        .from(schema.leadDocuments)
        .innerJoin(schema.leads, eq(schema.leadDocuments.leadId, schema.leads.id))
        .where(
          and(
            inArray(schema.leadDocuments.id, documentIds),
            eq(schema.leadDocuments.tenantId, context.tenantId)
          )
        );

      // Filter by branch if manager
      const allowedDocs = context.role === "manager" && context.branchId
        ? docs.filter((doc) => doc.branchId === context.branchId)
        : docs;

      if (allowedDocs.length === 0) return;

      const allowedIds = allowedDocs.map((d) => d.id);

      await tx
        .update(schema.leadDocuments)
        .set({
          status,
          reviewedBy: context.userId,
          reviewedAt: new Date(),
        })
        .where(inArray(schema.leadDocuments.id, allowedIds));

      // Audit logs and timeline interactions
      for (const doc of allowedDocs) {
        await tx.insert(schema.leadInteractions).values({
          id: randomUUID(),
          leadId: doc.leadId,
          userId: context.userId,
          tipo: "document_review",
          conteudo: `Documento "${doc.filename}" foi ${status === "approved" ? "aprovado" : "rejeitado"} em lote.`,
          metadata: { documentId: doc.id, status },
        });
      }
    });

    revalidatePath("/documentos");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao processar lote." };
  }
}

export async function getRequirementsForLead(leadId: string) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const [lead] = await db
    .select({
      planId: schema.leads.planId,
      carrierId: schema.carrierPlans.carrierId,
    })
    .from(schema.leads)
    .leftJoin(schema.carrierPlans, eq(schema.leads.planId, schema.carrierPlans.id))
    .where(and(
      eq(schema.leads.id, leadId),
      eq(schema.leads.tenantId, context.tenantId),
      context.role === "broker"
        ? eq(schema.leads.corretorId, context.userId)
        : context.role === "manager" && context.branchId
          ? eq(schema.leads.branchId, context.branchId)
          : undefined,
    ))
    .limit(1);

  if (!lead) return [];

  const allReqs = await db
    .select()
    .from(schema.documentRequirements)
    .where(eq(schema.documentRequirements.tenantId, context.tenantId));

  return allReqs.filter((req) => {
    if (req.planId) {
      return req.planId === lead.planId;
    }
    if (req.carrierId) {
      return req.carrierId === lead.carrierId;
    }
    return true;
  });
}
