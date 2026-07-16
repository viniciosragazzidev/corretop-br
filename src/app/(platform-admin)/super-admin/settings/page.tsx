import { getSystemSettings } from "@/features/system-settings/queries";
import { getNotificationCapabilityStates } from "@/features/notifications/queries";
import { updateCentralAtencaoSettingsAction, updateGlobalSearchSettingsAction, updateNotificationCapabilityAction, updateAiSettingsAction } from "@/app/(platform-admin)/super-admin/actions";
import { setRouteOnboardingGlobalAction } from "@/features/onboarding/actions/route-onboarding-actions";
import { PlatformAdminHeader } from "@/components/platform-admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function SuperAdminSettingsPage() {
  const settings = await getSystemSettings([
    "feature_central_atencao_enabled", 
    "feature_central_atencao_stagnant_days", 
    "feature_global_search_enabled", 
    "feature_route_onboarding_enabled",
    "ai_enabled",
    "ai_primary_provider",
    "ai_primary_model",
    "ai_fallback_provider",
    "ai_fallback_model",
    "ai_temperature",
    "ai_max_tokens",
    "ai_system_prompt",
    "ai_groq_api_key",
    "ai_openai_api_key",
    "ai_google_api_key",
    "ai_openrouter_api_key",
  ]);
  const notificationCapabilities = await getNotificationCapabilityStates();
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const centralEnabled = settingMap.get("feature_central_atencao_enabled") !== "false";
  const stagnantDays = settingMap.get("feature_central_atencao_stagnant_days") ?? "3";
  const globalSearchEnabled = settingMap.get("feature_global_search_enabled") !== "false";
  const routeOnboardingEnabled = settingMap.get("feature_route_onboarding_enabled") !== "false";

  const aiEnabled = settingMap.get("ai_enabled") === "true";
  const aiPrimaryProvider = settingMap.get("ai_primary_provider") ?? "groq";
  const aiPrimaryModel = settingMap.get("ai_primary_model") ?? "";
  const aiFallbackProvider = settingMap.get("ai_fallback_provider") ?? "none";
  const aiFallbackModel = settingMap.get("ai_fallback_model") ?? "";
  const aiTemperature = settingMap.get("ai_temperature") ?? "0.7";
  const aiMaxTokens = settingMap.get("ai_max_tokens") ?? "1024";
  const aiSystemPrompt = settingMap.get("ai_system_prompt") ?? "Você é um assistente virtual utilitário e direto.";
  const hasGroqKey = !!(process.env.GROQ_API_KEY || settingMap.get("ai_groq_api_key"));
  const hasOpenaiKey = !!(process.env.OPENAI_API_KEY || settingMap.get("ai_openai_api_key"));
  const hasGoogleKey = !!(process.env.GOOGLE_API_KEY || settingMap.get("ai_google_api_key"));
  const hasOpenrouterKey = !!(process.env.OPENROUTER_API_KEY || settingMap.get("ai_openrouter_api_key"));

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
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">PostgreSQL (Supabase)</Badge>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-muted-foreground">Versão do sistema:</span>
              <span className="font-semibold">v2.10.0-prod</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader><CardTitle>Onboarding por rota</CardTitle><CardDescription>ApresentaÃ§Ãµes contextuais aparecem uma vez por usuÃ¡rio e rota. O estado Ã© persistido por corretora, pode ser reiniciado pela central administrativa e toda alteraÃ§Ã£o fica auditada.</CardDescription></CardHeader>
          <CardContent>
            <form action={setRouteOnboardingGlobalAction} className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" value="true" defaultChecked={routeOnboardingEnabled} className="size-4 warning-[var(--primary)]" /><span><span className="font-medium">Onboarding de rotas habilitado</span><span className="block text-xs text-muted-foreground">Desative temporariamente sem apagar progresso nem auditoria.</span></span></label>
              <Button type="submit">Salvar onboarding</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Central de notificações</CardTitle>
            <CardDescription>Ative ou desative globalmente cada evento. Quando desativado, o CorreTop não cria o toast/in-app nem envia push para esse evento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {notificationCapabilities.map((capability) => (
              <form action={updateNotificationCapabilityAction} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between" key={capability.id}>
                <input name="capabilityId" type="hidden" value={capability.id} />
                <div className="min-w-0">
                  <p className="font-medium">{capability.label}</p>
                  <p className="text-xs text-muted-foreground">{capability.description} · {capability.channels}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={capability.enabled ? "success" : "outline"}>{capability.enabled ? "Ativo" : "Desativado"}</Badge>
                  <input name="enabled" type="hidden" value={capability.enabled ? "false" : "true"} />
                  <Button size="sm" type="submit" variant={capability.enabled ? "outline" : "default"}>{capability.enabled ? "Desativar" : "Ativar"}</Button>
                </div>
              </form>
            ))}
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
                <input type="checkbox" name="centralAtencaoEnabled" value="true" defaultChecked={centralEnabled} className="size-4 warning-[var(--primary)]" />
                <span><span className="font-medium">Central Atenção agora</span><span className="block text-xs text-muted-foreground">Exibir pendências acionáveis no roadmap.</span></span>
              </label>
              <label className="grid gap-1 text-xs font-medium">Dias para estagnação<Input name="stagnantDays" type="number" min={1} max={30} defaultValue={stagnantDays} /></label>
              <Button type="submit">Salvar alterações</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader><CardTitle>Busca global</CardTitle><CardDescription>Pesquisa leads, clientes, cotações, tarefas e equipe respeitando o escopo de cada usuário.</CardDescription></CardHeader>
          <CardContent><form action={updateGlobalSearchSettingsAction} className="flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="globalSearchEnabled" value="true" defaultChecked={globalSearchEnabled} className="size-4 warning-[var(--primary)]" /><span><span className="font-medium">Busca global habilitada</span><span className="block text-xs text-muted-foreground">Permitir pesquisas pelo cabeçalho do sistema.</span></span></label><Button type="submit" variant="outline">Salvar busca</Button></form></CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Motor de Inteligência Artificial</CardTitle>
            <CardDescription>
              Gerencie o motor central de IA da plataforma CorreTop. Os recursos utilizam o Vercel AI SDK para streaming rápido de respostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateAiSettingsAction} className="space-y-6">
              
              {/* Ativação Global */}
              <div className="flex items-center justify-between border-b pb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="aiEnabled" 
                    value="true" 
                    defaultChecked={aiEnabled} 
                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary" 
                  />
                  <span>
                    <span className="font-semibold block">Habilitar Inteligência Artificial</span>
                    <span className="text-xs text-muted-foreground">Ativa recursos inteligentes e rotas de chat em toda a plataforma.</span>
                  </span>
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Provedor Primário */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Provedor Primário</label>
                  <select 
                    name="primaryProvider" 
                    defaultValue={aiPrimaryProvider}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="groq">Groq (Llama 3.3 / Llama 3)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="google">Google Gemini (Gemini 2.5 Flash)</option>
                    <option value="openrouter">OpenRouter (Modelos Gratuitos & Diversos)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Provedor principal utilizado para completar requisições.</p>
                </div>

                {/* Modelo Primário Override */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Modelo Primário (Override)</label>
                  <Input 
                    name="primaryModel" 
                    placeholder="Ex: llama-3.3-70b-versatile" 
                    defaultValue={aiPrimaryModel} 
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco para usar o modelo padrão do provedor.</p>
                </div>

                {/* Provedor de Fallback */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Provedor de Fallback</label>
                  <select 
                    name="fallbackProvider" 
                    defaultValue={aiFallbackProvider}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="none">Nenhum (Disparar erro em caso de falha)</option>
                    <option value="groq">Groq</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Provedor utilizado caso o primário retorne erro ou atinja limite.</p>
                </div>

                {/* Modelo de Fallback Override */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Modelo de Fallback (Override)</label>
                  <Input 
                    name="fallbackModel" 
                    placeholder="Ex: gpt-4o-mini" 
                    defaultValue={aiFallbackModel} 
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco para usar o modelo padrão do fallback.</p>
                </div>

                {/* Temperatura */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Temperatura</label>
                  <Input 
                    name="temperature" 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="1" 
                    defaultValue={aiTemperature} 
                  />
                  <p className="text-xs text-muted-foreground">Precisão e criatividade da IA (0.0 = preciso, 1.0 = criativo).</p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Limite de Tokens (Max Tokens)</label>
                  <Input 
                    name="maxTokens" 
                    type="number" 
                    min="1" 
                    max="8192" 
                    defaultValue={aiMaxTokens} 
                  />
                  <p className="text-xs text-muted-foreground">Tamanho máximo da resposta gerada.</p>
                </div>
              </div>

              {/* Chaves de API */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-bold tracking-tight">Chaves de API (Configuração de Credenciais)</h4>
                <p className="text-xs text-muted-foreground">
                  As chaves informadas abaixo serão salvas no banco de dados. Caso já estejam configuradas nas variáveis de ambiente (.env), não é necessário preencher.
                </p>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Groq API Key</label>
                    <Input 
                      name="groqApiKey" 
                      type="password" 
                      placeholder={hasGroqKey ? "Configurado (Preencha para alterar)" : "Chave da API Groq"} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">OpenAI API Key</label>
                    <Input 
                      name="openaiApiKey" 
                      type="password" 
                      placeholder={hasOpenaiKey ? "Configurado (Preencha para alterar)" : "Chave da API OpenAI"} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Google API Key</label>
                    <Input 
                      name="googleApiKey" 
                      type="password" 
                      placeholder={hasGoogleKey ? "Configurado (Preencha para alterar)" : "Chave da API Google"} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">OpenRouter API Key</label>
                    <Input 
                      name="openrouterApiKey" 
                      type="password" 
                      placeholder={hasOpenrouterKey ? "Configurado (Preencha para alterar)" : "Chave da API OpenRouter"} 
                    />
                  </div>
                </div>
              </div>

              {/* Prompt de Sistema Global */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-semibold">Instruções do Sistema (System Prompt Global)</label>
                <textarea 
                  name="systemPrompt" 
                  rows={4}
                  defaultValue={aiSystemPrompt}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                  placeholder="Você é um assistente virtual utilitário e direto..."
                />
                <p className="text-xs text-muted-foreground">Instruções comportamentais enviadas por padrão a todas as chamadas de IA.</p>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button type="submit">Salvar Configurações de IA</Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
