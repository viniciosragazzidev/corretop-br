import { desc, eq } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function NotificationsPage() {
  const context = await getRequiredTenantContext();
  const notifications = await getDatabase().select({ id: schema.notifications.id, title: schema.notifications.title, message: schema.notifications.message, type: schema.notifications.type, readAt: schema.notifications.readAt, createdAt: schema.notifications.createdAt, leadId: schema.notifications.leadId })
    .from(schema.notifications).where(eq(schema.notifications.recipientUserId, context.userId)).orderBy(desc(schema.notifications.createdAt)).limit(50);
  return <><DashboardHeader breadcrumb="Acompanhamento" title="Notificações" /><main className="flex min-h-full flex-col gap-6 p-4 lg:p-6"><div><p className="text-xs font-medium text-primary">ACOMPANHAMENTO</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Notificações</h1><p className="mt-1 text-sm text-muted-foreground">Avisos operacionais da sua equipe e dos seus leads.</p></div><Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Atividade recente</CardTitle><CardDescription>Eventos direcionados a você.</CardDescription></CardHeader><CardContent className="divide-y divide-border p-0">{notifications.map((notification) => <article className="flex items-start gap-3 px-5 py-4" key={notification.id}><span className={`mt-1 size-2 rounded-full ${notification.readAt ? "bg-muted-foreground" : "bg-primary"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{notification.title}</p><Badge variant="outline">{notification.type === "lead_service_started" ? "Atendimento" : "Operacional"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>{notification.leadId ? <a className="mt-2 inline-block text-xs font-medium text-primary hover:underline" href={`/leads/${notification.leadId}`}>Abrir lead</a> : null}</div><time className="shrink-0 text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(notification.createdAt)}</time></article>)}{!notifications.length ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma notificação nova.</div> : null}</CardContent></Card></main></>;
}
