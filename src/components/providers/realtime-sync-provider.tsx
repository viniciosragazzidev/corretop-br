"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    import("cuelume")
      .then((cuelume) => {
        playSoundRef.current = cuelume.play;
        cuelume.bind();
      })
      .catch((error) => console.error("Failed to load cuelume:", error));
  }, []);

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
            if (role === "broker" && newRow.corretor_id === userId) {
              playSoundRef.current?.("success");
              toast.success("Novo lead recebido!", {
                description: `O lead "${newRow.nome}" foi atribuído a você.`,
                action: {
                  label: "Abrir",
                  onClick: () => router.push(`/leads/${newRow.id}`),
                },
              });
              router.refresh();
            } else if (role === "manager" && newRow.branch_id === branchId) {
              playSoundRef.current?.("chime");
              toast.info("Novo lead na unidade!", {
                description: newRow.corretor_id
                  ? `"${newRow.nome}" chegou e foi distribuído.`
                  : `"${newRow.nome}" chegou e aguarda distribuição.`,
                action: {
                  label: "Visualizar",
                  onClick: () => router.push(`/leads/${newRow.id}`),
                },
              });
              router.refresh();
            } else if (role === "director") {
              playSoundRef.current?.("chime");
              toast.info("Novo lead na corretora!", {
                description: `"${newRow.nome}" foi recebido no sistema.`,
                action: {
                  label: "Visualizar",
                  onClick: () => router.push(`/leads/${newRow.id}`),
                },
              });
              router.refresh();
            }
          }

          if (payload.eventType === "UPDATE" && newRow) {
            // The notification INSERT is the authoritative signal for the
            // assignment toast. UPDATE old values are not guaranteed unless
            // replica identity is FULL in the active production database.
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
  }, [tenantId, userId, role, branchId, router]);

  return <>{children}</>;
}
