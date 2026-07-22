"use client";

import { useEffect, startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Fingerprint, X } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
              <div className="group relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg transition-all duration-200 hover:shadow-xl">
                {/* Header / Main content */}
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Fingerprint className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold text-primary bg-primary/10 border-0">
                        Segurança
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold tracking-tight text-foreground">
                      Cadastre sua Biometria
                    </h4>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Acesse sua conta em 1 toque usando Face ID ou digital do aparelho.
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => toast.dismiss(t)}
                    aria-label="Fechar notificação"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Actions */}
                <div className="mt-3.5 flex items-center gap-2 border-t border-border/60 pt-3">
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-semibold"
                    onClick={() => {
                      toast.dismiss(t);
                      startTransition(() => {
                        router.push("/settings?tab=seguranca#passkey-section");
                      });
                    }}
                  >
                    <Fingerprint className="mr-1.5 size-3.5" />
                    Cadastrar agora
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-muted-foreground hover:text-foreground"
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
