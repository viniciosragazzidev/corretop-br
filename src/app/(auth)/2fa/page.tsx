"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Key, LockKey } from "@/components/huge-icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/shared/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim(), trustDevice })
        : await authClient.twoFactor.verifyTotp({ code: code.replace(/\D/g, ""), trustDevice });
      if (result.error) throw new Error(result.error.message ?? "Código inválido.");
      toast.success("Acesso confirmado.");
      router.replace("/dashboard"); router.refresh();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Não foi possível confirmar o código.";
      setError(message); toast.error(message);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#d4d4d8]"><LockKey size={19} /></div>
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a1a1aa]">Acesso protegido</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#f5f5f5] sm:text-4xl">Confirme sua identidade</h1><p className="mt-2 text-sm leading-6 text-[#a1a1aa]">Digite o código exibido no seu aplicativo autenticador.</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2"><Label className="text-xs font-medium text-[#d4d4d8]" htmlFor="two-factor-code">{useBackup ? "Código de recuperação" : "Código de 6 dígitos"}</Label><Input autoFocus autoComplete="one-time-code" className="h-12 border-white/10 bg-white/[0.045] text-center font-mono text-lg tracking-[0.35em] text-[#f5f5f5] placeholder:text-[#52525b] focus-visible:border-white/30 focus-visible:ring-white/10" id="two-factor-code" inputMode={useBackup ? "text" : "numeric"} maxLength={useBackup ? 32 : 6} onChange={(event) => setCode(event.target.value)} placeholder={useBackup ? "ABCD-EFGH" : "000000"} value={code} required /></div>
        <label className="flex items-center gap-2 text-xs text-[#a1a1aa]"><input type="checkbox" checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} className="size-3.5 accent-white" /> Confiar neste dispositivo por 30 dias</label>
        {error ? <p aria-live="polite" className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-sm leading-5 text-red-300" role="alert">{error}</p> : null}
        <Button className="h-11 w-full justify-between bg-[#f5f5f5] px-4 text-[#111112] hover:bg-white" disabled={busy || !code.trim()} type="submit"><span>{busy ? "Verificando..." : "Continuar"}</span><ArrowRight size={17} /></Button>
      </form>
      <button type="button" onClick={() => { setUseBackup((current) => !current); setCode(""); setError(""); }} className="flex w-full items-center justify-center gap-2 text-xs text-[#a1a1aa] transition-colors hover:text-[#f5f5f5]"><Key size={14} /> {useBackup ? "Usar código do autenticador" : "Usar código de recuperação"}</button>
    </div>
  );
}
