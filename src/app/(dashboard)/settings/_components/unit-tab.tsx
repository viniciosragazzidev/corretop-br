import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UnitTab({ branchName, isDirector }: { branchName: string | null; isDirector: boolean }) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>{isDirector ? "Unidades" : "Minha unidade"}</CardTitle>
        <CardDescription>{isDirector ? "A identidade da corretora é configurada em Empresa. Regras operacionais podem ser aplicadas por unidade." : "Configurações operacionais ficam limitadas à unidade vinculada ao seu acesso."}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">Escopo atual</p>
          <p className="mt-1 text-sm font-medium">{isDirector ? "Todas as unidades da corretora" : branchName ?? "Nenhuma unidade vinculada"}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Logo, nome, CNPJ e cor da corretora são dados globais e continuam restritos ao diretor.</p>
        </div>
      </CardContent>
    </Card>
  );
}
