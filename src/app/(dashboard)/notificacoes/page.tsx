import Link from "next/link";
import { desc, and, eq } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";
import { PushNotificationManager } from "@/features/notifications/components/push-notification-manager";

type NotificationFilter = "all" | "unread" | "urgent";

function priorityFor(type: string): "urgent" | "attention" | "info" {
  if (["lead_unworked", "lead_stalled", "document_rejected"].includes(type)) return "urgent";
  if (["agent.lead_assigned", "lead_feedback_reminder", "client_renewal_reminder"].includes(type)) return "attention";
  return "info";
}

function priorityLabel(priority: ReturnType<typeof priorityFor>) {
  return priority === "urgent" ? "Ação necessária" : priority === "attention" ? "Acompanhar" : "Informativo";
}

function destinationLabel(type: string) {
  if (type.startsWith("lead_") || type === "agent.lead_assigned") return "Abrir lead";
  if (type === "client_renewal_reminder") return "Abrir cliente";
  return "Ver contexto";
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const context = await getRequiredTenantContext();
  const params = await searchParams;
  const filter: NotificationFilter = params.filter === "unread" || params.filter === "urgent" ? params.filter : "all";
  const notifications = await getDatabase().select({ id: schema.notifications.id, title: schema.notifications.title, message: schema.notifications.message, type: schema.notifications.type, readAt: schema.notifications.readAt, createdAt: schema.notifications.createdAt, leadId: schema.notifications.leadId }).from(schema.notifications).where(and(eq(schema.notifications.tenantId, context.tenantId), eq(schema.notifications.recipientUserId, context.userId))).orderBy(desc(schema.notifications.createdAt)).limit(100);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const visible = notifications.filter((notification) => filter === "all" || (filter === "unread" && !notification.readAt) || (filter === "urgent" && priorityFor(notification.type) === "urgent"));

  return <><DashboardHeader breadcrumb="Acompanhamento" title="Notificações" /><main className="flex min-h-full flex-col gap-6 p-4 lg:p-6"><section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium text-primary">ACOMPANHAMENTO</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Notificações</h1><p className="mt-1 text-sm text-muted-foreground">Avisos agrupados por urgência, com destino direto para resolver cada pendência.</p></div>{unreadCount > 0 ? <form action={markAllNotificationsReadAction}><Button size="sm" type="submit" variant="outline">Marcar todas como lidas</Button></form> : null}</section><PushNotificationManager /><Card className="border-border bg-card shadow-none"><CardHeader className="gap-4"><div><CardTitle>Atividade recente</CardTitle><CardDescription>{unreadCount ? `${unreadCount} ${unreadCount === 1 ? "aviso não lido" : "avisos não lidos"}.` : "Tudo lido por enquanto."}</CardDescription></div><nav aria-label="Filtros de notificações" className="flex flex-wrap gap-2"><Link className={`rounded-md border px-3 py-1.5 text-xs font-medium ${filter === "all" ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`} href="/notificacoes">Todas ({notifications.length})</Link><Link className={`rounded-md border px-3 py-1.5 text-xs font-medium ${filter === "unread" ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`} href="/notificacoes?filter=unread">Não lidas ({unreadCount})</Link><Link className={`rounded-md border px-3 py-1.5 text-xs font-medium ${filter === "urgent" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:bg-muted"}`} href="/notificacoes?filter=urgent">Ação necessária</Link></nav></CardHeader><CardContent className="divide-y divide-border p-0">{visible.map((notification) => { const priority = priorityFor(notification.type); return <article className="flex items-start gap-3 px-5 py-4" key={notification.id}><span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.readAt ? "bg-muted-foreground/40" : priority === "urgent" ? "bg-destructive" : "bg-primary"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{notification.title}</p><Badge variant={priority === "urgent" ? "destructive" : "outline"}>{priorityLabel(priority)}</Badge></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p><div className="mt-2 flex flex-wrap items-center gap-3">{notification.leadId ? <Link className="text-xs font-medium text-primary hover:underline" href={`/leads/${notification.leadId}`}>{destinationLabel(notification.type)}</Link> : null}{!notification.readAt ? <form action={markNotificationReadAction}><input name="notificationId" type="hidden" value={notification.id} /><button className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline" type="submit">Marcar como lida</button></form> : <span className="text-xs text-muted-foreground">Lida</span>}</div></div><time className="shrink-0 text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(notification.createdAt)}</time></article>; })}{!visible.length ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma notificação neste filtro.</div> : null}</CardContent></Card></main></>;
}
