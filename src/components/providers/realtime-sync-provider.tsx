"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface RealtimeSyncProviderProps {
  children: React.ReactNode;
  tenantId: string;
  userId: string;
  role: string;
  branchId: string | null;
}

interface LeadRow {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  corretor_id: string | null;
  nome: string;
  status: string;
}

interface NotificationRow {
  id: string;
  tenant_id: string;
  recipient_user_id: string;
  lead_id: string | null;
  type: string;
  title: string;
  message: string;
}

export function RealtimeSyncProvider({
  children,
  tenantId,
  userId,
  role,
  branchId,
}: RealtimeSyncProviderProps) {
  const router = useRouter();
  const playSoundRef = useRef<((cue: any) => void) | null>(null);
  const seenLeadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    import("cuelume")
      .then((cuelume) => {
        playSoundRef.current = cuelume.play;
        cuelume.bind();
      })
      .catch((error) => console.error("Failed to load cuelume:", error));
  }, []);

  const notifyNewLead = useCallback(
    (lead: LeadRow) => {
      const isAssignedToMe = lead.corretor_id === userId;
      const isInMyBranch = lead.branch_id === branchId;
      const isUnassigned = !lead.corretor_id;
      const hasNoBranch = !lead.branch_id;
      const canNotify =
        isAssignedToMe ||
        isUnassigned ||
        hasNoBranch ||
        role === "director" ||
        (role === "manager" && isInMyBranch);

      if (!canNotify) return;

      playSoundRef.current?.("success");

      const description = isAssignedToMe
        ? `O lead "${lead.nome}" foi distribuído para você.`
        : isUnassigned && hasNoBranch
          ? `"${lead.nome}" chegou sem filial e está aguardando distribuição.`
          : isUnassigned
            ? `"${lead.nome}" chegou na sua unidade e está aguardando distribuição.`
            : `Novo lead "${lead.nome}" foi adicionado.`;

      toast.success("Novo lead recebido!", {
        description,
        action: {
          label: "Abrir",
          onClick: () => router.push(`/leads/${lead.id}`),
        },
        duration: 10_000,
      });
    },
    [userId, branchId, role, router],
  );

  // ── Supabase Realtime: leads + notifications ────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channelName = `public:leads:tenant:${tenantId}:user:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newRow = payload.new as LeadRow | null;
          const oldRow = payload.old as Partial<LeadRow> | null;

          if (payload.eventType === "INSERT" && newRow) {
            if (!seenLeadIdsRef.current.has(newRow.id)) {
              seenLeadIdsRef.current.add(newRow.id);
              notifyNewLead(newRow);
            }
            router.refresh();
          }

          if (payload.eventType === "UPDATE" && newRow) {
            if (
              role === "director" ||
              (role === "manager" && (newRow.branch_id === branchId || oldRow?.branch_id === branchId)) ||
              (role === "broker" && (
                newRow.corretor_id === userId ||
                oldRow?.corretor_id === userId ||
                newRow.branch_id === branchId ||
                oldRow?.branch_id === branchId
              ))
            ) {
              router.refresh();
            }
          }

          if (payload.eventType === "DELETE" && oldRow) {
            if (
              role === "director" ||
              (role === "manager" && oldRow.branch_id === branchId) ||
              (role === "broker" && (oldRow.corretor_id === userId || oldRow.branch_id === branchId))
            ) {
              router.refresh();
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as NotificationRow | null;
          if (!notification || notification.tenant_id !== tenantId) return;

          playSoundRef.current?.("success");
          toast.success(notification.title, {
            description: notification.message,
            action: notification.lead_id
              ? {
                  label: "Abrir",
                  onClick: () => router.push(`/leads/${notification.lead_id}`),
                }
              : undefined,
          });
          router.refresh();
        },
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Falha ao assinar atualizações em tempo real dos leads.", error);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, userId, role, branchId, router, notifyNewLead]);

  return <>{children}</>;
}
