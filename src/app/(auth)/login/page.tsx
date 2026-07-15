"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeSlash } from "@/components/huge-icons";
import { toast } from "sonner";

import { signIn } from "@/shared/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
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
        signIn.email({ email, password }, { onSuccess: () => {} }),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("A autenticação demorou mais que o esperado. Verifique sua conexão e tente novamente.")), 15000)),
      ]);
      if (result.error) { const message = result.error.message || "Credenciais inválidas"; setError(message); toast.error(message); return; }
      toast.success("Login realizado. Abrindo seu painel...");
      // Navigate only after Better Auth has persisted the session cookie.
      // A server action here can race that cookie store and return
      // "Unexpected response" even though authentication succeeded.
      window.location.replace("/dashboard");
    } catch (authError) { const message = authError instanceof Error ? authError.message : "Não foi possível concluir o login."; setError(message); toast.error(message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Acesse sua conta</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Entre com seu e-mail e senha de acesso</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@corretora.com"
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              autoComplete="current-password"
              className="pr-10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              disabled={loading}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-xs font-normal text-zinc-500 dark:text-zinc-400 cursor-pointer">
              Lembrar de mim
            </Label>
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.info("Para recuperar sua senha, entre em contato com o administrador da sua corretora.");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Esqueceu a senha?
          </a>
        </div>

        {error && (
          <p className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs font-medium text-red-500" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full justify-center h-10" disabled={loading}>
          {loading ? "Entrando..." : "Entrar no painel"}
        </Button>
      </form>

      <p className="text-center text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        Ao acessar a plataforma, você concorda com os nossos{" "}
        <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300" onClick={(e) => e.preventDefault()}>Termos de Uso</a>
        {" "}e{" "}
        <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300" onClick={(e) => e.preventDefault()}>Políticas de Privacidade</a>.
      </p>
    </div>
  );
}
