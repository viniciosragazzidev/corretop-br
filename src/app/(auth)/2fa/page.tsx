import Link from "next/link";

export default function TwoFactorPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Verificação em duas etapas</h1>
      <p className="text-sm text-muted-foreground">
        A autenticação em duas etapas ainda não está disponível nesta fase.
      </p>
      <Link className="text-sm underline" href="/login">
        Voltar ao login
      </Link>
    </div>
  );
}
