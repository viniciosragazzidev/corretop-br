"use client";

import { useEffect, startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Fingerprint, LockKey } from "@/components/huge-icons";
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
              <div className="flex w-full max-w-sm flex-col gap-3.5 rounded-2xl border border-primary/20 bg-card p-4 shadow-xl backdrop-blur-md dark:bg-card/95">
                <div className="flex items-start justify-between gap-3">
                  <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5">
                    <Fingerprint className="size-6 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Acesso por Biometria
                    </span>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      Entrar com Face ID ou Digital?
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Cadastre a biometria do seu celular para fazer login instantâneo com total segurança.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 h-9 rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98]"
                    onClick={() => {
                      toast.dismiss(t);
                      startTransition(() => {
                        router.push("/settings?tab=seguranca#passkey-section");
                      });
                    }}
                  >
                    <Fingerprint className="mr-1.5 size-4" />
                    Cadastrar Biometria
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
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
                    Agora não
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
