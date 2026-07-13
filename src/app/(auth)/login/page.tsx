"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeSlash, LockKey, ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signIn } from "@/shared/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    toast.info("Validando seu acesso...");
    try {
      const result = await Promise.race([
        signIn.email({ email, password }),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("A autenticação demorou mais que o esperado. Verifique sua conexão e tente novamente.")), 15000)),
      ]);
      if (result.error) { const message = result.error.message || "Credenciais inválidas"; setError(message); toast.error(message); return; }
      toast.success("Login realizado. Abrindo seu painel...");
      router.replace("/dashboard");
      router.refresh();
    } catch (authError) { const message = authError instanceof Error ? authError.message : "Não foi possível concluir o login."; setError(message); toast.error(message); }
    finally { setLoading(false); }
  }

  return <div className="space-y-8"><div className="lg:hidden"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f4f4f5] text-sm font-bold text-[#111112]">C</span><span className="font-semibold tracking-tight">CorreTop</span></div></div><div className="space-y-3"><div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#d4d4d8]"><LockKey size={19} /></div><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a1a1aa]">Acesso à corretora</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#f5f5f5] sm:text-4xl">Entrar</h1><p className="mt-2 text-sm leading-6 text-[#a1a1aa]">Acesse seu painel e continue sua operação.</p></div></div><form onSubmit={handleSubmit} className="space-y-5"><div className="space-y-2"><Label className="text-xs font-medium text-[#d4d4d8]" htmlFor="email">E-mail</Label><Input autoComplete="email" className="h-11 border-white/10 bg-white/[0.045] text-[#f5f5f5] placeholder:text-[#52525b] focus-visible:border-white/30 focus-visible:ring-white/10" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="voce@corretora.com" type="email" value={email} required /></div><div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-xs font-medium text-[#d4d4d8]" htmlFor="password">Senha</Label><span className="text-xs text-[#71717a]">Acesso protegido</span></div><div className="relative"><Input autoComplete="current-password" className="h-11 border-white/10 bg-white/[0.045] pr-11 text-[#f5f5f5] placeholder:text-[#52525b] focus-visible:border-white/30 focus-visible:ring-white/10" id="password" onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" type={showPassword ? "text" : "password"} value={password} required /><button aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#71717a] transition-colors hover:bg-white/[0.06] hover:text-[#f5f5f5]" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button></div></div>{error ? <p aria-live="polite" className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-sm leading-5 text-red-300" role="alert">{error}</p> : null}<Button className="h-11 w-full justify-between bg-[#f5f5f5] px-4 text-[#111112] hover:bg-white" disabled={loading} type="submit">{loading ? <span>Entrando...</span> : <><span>Entrar no painel</span><ArrowRight size={17} /></>}</Button></form><div className="flex items-center gap-3 text-xs text-[#71717a]"><span className="h-px flex-1 bg-white/10" /><span>Ambiente CorreTop</span><span className="h-px flex-1 bg-white/10" /></div></div>;
}
