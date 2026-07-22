"use client";

import { useEffect, startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LockKey } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/shared/auth/client";
import { recordSecurityAuditAction } from "@/app/(dashboard)/settings/security-actions";

export function PasskeyToastHandler({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return;

    const SNOOZE_KEY = `passkey-prompt-dismissed:${userId}`;

    try {
      if (localStorage.getItem(SNOOZE_KEY) === "true") return;
    } catch {
      // localStorage error fallback
    }

    let isMounted = true;

    async function checkPasskeys() {
      try {
        const result = await authClient.passkey.listUserPasskeys();
        if (!isMounted) return;
        if (result.data && Array.isArray(result.data) && result.data.length === 0) {
          toast.custom(
            (t) => (
              <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <LockKey size={20} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Segurança da Conta
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      Cadastre sua Passkey
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Entre com biometria ou PIN de forma simples e rápida, sem precisar digitar sua senha.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Fechar"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 border-t border-border/50 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      toast.dismiss(t);
                      startTransition(() => {
                        router.push("/settings?tab=seguranca#passkey");
                      });
                    }}
                  >
                    Configurar agora
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      try {
                        localStorage.setItem(SNOOZE_KEY, "true");
                      } catch {
                        // ignore localStorage errors
                      }
                      void recordSecurityAuditAction("dispensou_toast_passkey");
                      toast.dismiss(t);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
              position: "bottom-right",
              style: { padding: 0, background: "transparent", boxShadow: "none", border: "none", width: "auto" },
            },
          );
        }
      } catch (error) {
        console.error("Erro ao verificar passkeys do usuário:", error);
      }
    }

    void checkPasskeys();

    return () => {
      isMounted = false;
    };
  }, [userId, router]);

  return null;
}
