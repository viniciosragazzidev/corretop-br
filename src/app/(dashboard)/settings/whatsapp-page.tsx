"use client";

import { CheckCircle, ShieldWarning } from "@/components/huge-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppConnectDialog } from "@/components/whatsapp/whatsapp-connect-dialog";
import { MetaCloudSetupCard } from "@/features/communication-channels/components/meta-cloud-setup-card";
import { getWhatsAppConnection } from "./whatsapp-actions";

type Connection = Awaited<ReturnType<typeof getWhatsAppConnection>>;
type OfficialSetup = {
  enabled: boolean;
  configured: boolean;
  missing: string[];
  appId: string | null;
  embeddedSignupConfigId: string | null;
  canConfigure: boolean;
  branches: { id: string; name: string }[];
  channels: { id: string; displayPhoneNumber: string | null; verifiedName: string | null; branchName: string | null; status: string; qualityRating: string | null; isDefault: boolean }[];
};

export function WhatsAppPage({ initial, returnTo, official }: { initial: Connection; returnTo?: string; official: OfficialSetup }) {
  const ready = initial.status === "ready";
  return <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
    <div>
      <p className="text-xs font-medium text-primary">INTEGRAÇÕES</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Integração WhatsApp</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Priorize o canal oficial da Meta. A conexão por QR continua disponível apenas durante a transição.</p>
    </div>
    <Card className="border-warning/30 bg-accent/10 shadow-none"><CardContent className="flex items-start gap-3 p-5"><ShieldWarning className="mt-0.5 size-6 shrink-0 text-warning" /><div><p className="font-semibold text-warning-foreground">Privacidade por lead</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Conversas pessoais, grupos e números sem vínculo são descartados antes de qualquer gravação.</p></div></CardContent></Card>
    <MetaCloudSetupCard appId={official.appId} branches={official.branches} canConfigure={official.canConfigure} channels={official.channels} configId={official.embeddedSignupConfigId} configured={official.configured} enabled={official.enabled} missing={official.missing} />
    <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Conexão QR legada</CardTitle><CardDescription>Use somente enquanto o canal oficial ainda não estiver disponível para sua operação.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold">{ready ? "WhatsApp conectado" : "WhatsApp ainda não conectado"}</p><p className="mt-1 text-xs text-muted-foreground">{ready ? "O chat interno legado está pronto para os atendimentos." : "A conexão pode ser aberta deste card durante a migração."}</p></div><WhatsAppConnectDialog initial={initial} returnTo={returnTo} /></CardContent></Card>
    <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="text-primary" /> Como o atendimento funciona</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3"><p><strong className="text-foreground">1. Conecte:</strong> o Diretor conecta o número oficial pela Meta.</p><p><strong className="text-foreground">2. Atenda:</strong> o corretor envia mensagens na tela do lead.</p><p><strong className="text-foreground">3. Proteja:</strong> apenas mensagens vinculadas a leads são importadas.</p></CardContent></Card>
  </main>;
}
