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
  created_at: string;
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
  const lastPollRef = useRef<Date>(new Date());

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

  // ── Polling fallback: check for new leads every 2s ──────────────────
  useEffect(() => {
    const supabase = createClient();

    async function pollForNewLeads() {
      try {
        const since = new Date(Date.now() - 5_000).toISOString();
        const { data: leads } = await supabase
          .from("leads")
          .select("id, tenant_id, branch_id, corretor_id, nome, status, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!leads?.length) return;

        for (const lead of leads) {
          if (!seenLeadIdsRef.current.has(lead.id)) {
            seenLeadIdsRef.current.add(lead.id);
            notifyNewLead(lead as LeadRow);
            router.refresh();
          }
        }

        // Cleanup old IDs from Set (keep last 500)
        if (seenLeadIdsRef.current.size > 500) {
          const ids = [...seenLeadIdsRef.current];
          seenLeadIdsRef.current = new Set(ids.slice(-250));
        }
      } catch {
        // Silent fail — polling is best-effort
      }
    }

    const interval = setInterval(pollForNewLeads, 2_000);
    return () => clearInterval(interval);
  }, [tenantId, notifyNewLead, router]);

  // ── Realtime: leads ─────────────────────────────────────────────────
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
