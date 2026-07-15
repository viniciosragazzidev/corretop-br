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

export function RealtimeSyncProvider({
  children,
  tenantId,
  userId,
  role,
  branchId,
}: RealtimeSyncProviderProps) {
  const router = useRouter();
  const playSoundRef = useRef<((cue: any) => void) | null>(null);

  // Dynamically load cuelume on client side only to prevent SSR/Next.js hydration mismatch or window.AudioContext errors
  useEffect(() => {
    import("cuelume")
      .then((cuelume) => {
        playSoundRef.current = cuelume.play;
        cuelume.bind(); // Wires data-cuelume-* attributes
      })
      .catch((error) => {
        console.error("Failed to load cuelume:", error);
      });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `public:leads:tenant:${tenantId}`;

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
              toast.success("Novo lead recebido! ⚡", {
                description: `O lead "${newRow.nome}" foi atribuído a você.`,
                action: {
                  label: "Abrir",
                  onClick: () => router.push(`/leads/${newRow.id}`),
                },
              });
              router.refresh();
            } else if (role === "manager" && newRow.branch_id === branchId) {
              playSoundRef.current?.("chime");
              toast.info("Novo lead na unidade! 📍", {
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
              toast.info("Novo lead na corretora! 🏢", {
                description: `"${newRow.nome}" foi recebido no sistema.`,
                action: {
                  label: "Visualizar",
                  onClick: () => router.push(`/leads/${newRow.id}`),
                },
              });
              router.refresh();
            }
          }

          if (payload.eventType === "UPDATE" && newRow && oldRow) {
            // Check if it was reassigned to the active user
            if (newRow.corretor_id === userId && oldRow.corretor_id !== userId) {
              playSoundRef.current?.("success");
              toast.success("Lead atribuído a você! ⚡", {
                description: `O lead "${newRow.nome}" foi direcionado para você.`,
                action: {
                  label: "Abrir",
                  onClick: () => router.push(`/leads/${newRow.id}`),
                },
              });
              router.refresh();
            } else {
              // General update (change of status, etc.)
              // Refresh page if the active user is related to this lead (broker, manager of branch, or director)
              if (
                role === "director" ||
                (role === "manager" && (newRow.branch_id === branchId || oldRow.branch_id === branchId)) ||
                (role === "broker" && (
                  newRow.corretor_id === userId ||
                  oldRow.corretor_id === userId ||
                  newRow.branch_id === branchId ||
                  oldRow.branch_id === branchId
                ))
              ) {
                router.refresh();
              }
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
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, userId, role, branchId, router]);

  return <>{children}</>;
}
