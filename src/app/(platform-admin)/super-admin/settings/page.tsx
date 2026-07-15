import { inArray } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";
import { updateCentralAtencaoSettingsAction, updateGlobalSearchSettingsAction } from "@/app/(platform-admin)/super-admin/actions";
import { PlatformAdminHeader } from "@/components/platform-admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function SuperAdminSettingsPage() {
  const settings = await getDatabase().select({ key: schema.systemSettings.key, value: schema.systemSettings.value }).from(schema.systemSettings).where(inArray(schema.systemSettings.key, ["feature_central_atencao_enabled", "feature_central_atencao_stagnant_days", "feature_global_search_enabled"]));
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const centralEnabled = settingMap.get("feature_central_atencao_enabled") !== "false";
  const stagnantDays = settingMap.get("feature_central_atencao_stagnant_days") ?? "3";
  const globalSearchEnabled = settingMap.get("feature_global_search_enabled") !== "false";

  return (
    <>
      <PlatformAdminHeader breadcrumb="CorreTop / Admin" title="Configurações da Plataforma" />

      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Parâmetros Globais</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste as configurações gerais da plataforma CorreTop.
            </p>
          </div>
        </section>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Configuração do Servidor</CardTitle>
            <CardDescription>Parâmetros operacionais do ambiente ativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-muted-foreground">Nome do sistema:</span>
              <span className="font-semibold">CorreTop CRM</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-muted-foreground">Banco de dados:</span>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">PostgreSQL (Neon)</Badge>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-muted-foreground">Versão do sistema:</span>
              <span className="font-semibold">v2.10.0-prod</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Capacidades operacionais</CardTitle>
            <CardDescription>Controle reversível de recursos que impactam a operação dos tenants. Toda alteração é registrada na auditoria da plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCentralAtencaoSettingsAction} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="centralAtencaoEnabled" value="true" defaultChecked={centralEnabled} className="size-4 accent-[var(--primary)]" />
                <span><span className="font-medium">Central Atenção agora</span><span className="block text-xs text-muted-foreground">Exibir pendências acionáveis no roadmap.</span></span>
              </label>
              <label className="grid gap-1 text-xs font-medium">Dias para estagnação<Input name="stagnantDays" type="number" min={1} max={30} defaultValue={stagnantDays} /></label>
              <Button type="submit">Salvar alterações</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader><CardTitle>Busca global</CardTitle><CardDescription>Pesquisa leads, clientes, cotações, tarefas e equipe respeitando o escopo de cada usuário.</CardDescription></CardHeader>
          <CardContent><form action={updateGlobalSearchSettingsAction} className="flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="globalSearchEnabled" value="true" defaultChecked={globalSearchEnabled} className="size-4 accent-[var(--primary)]" /><span><span className="font-medium">Busca global habilitada</span><span className="block text-xs text-muted-foreground">Permitir pesquisas pelo cabeçalho do sistema.</span></span></label><Button type="submit" variant="outline">Salvar busca</Button></form></CardContent>
        </Card>
      </main>
    </>
  );
}
