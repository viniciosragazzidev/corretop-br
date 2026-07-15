"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/shared/auth/client";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    toast.info("Validando acesso administrativo...");
    try {
      const result = await signIn.email({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      }, {
        onSuccess: () => {}
      });
      if (result.error) {
        setError(result.error.message || "Credenciais inválidas");
        toast.error(result.error.message || "Credenciais inválidas");
        setLoading(false);
        return;
      }
      toast.success("Acesso administrativo confirmado.");
      window.location.replace("/super-admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir o login.";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }
  return <div className="space-y-6"><div className="space-y-2 text-center"><p className="text-xs font-medium text-primary">ACESSO INTERNO</p><h1 className="text-2xl font-semibold">Super administração</h1><p className="text-sm text-muted-foreground">Use apenas as credenciais da equipe CorreTop.</p></div><form action={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div><div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" required /></div>{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button className="w-full" disabled={loading} type="submit">{loading ? "Entrando..." : "Entrar como Super Admin"}</Button></form></div>;
}
