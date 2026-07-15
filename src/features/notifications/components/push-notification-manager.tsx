"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";

import {
  Bell,
  BellRinging,
  CheckCircle,
} from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  subscribeUserAction,
  unsubscribeUserAction,
  sendTestNotificationAction,
  getSubscriptionStatusAction,
} from "../push-actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkSubscription = useCallback(async () => {
    try {
      const status = await getSubscriptionStatusAction();
      setIsSubscribed(status.subscribed);
      setSubscriptionCount(status.count);
    } catch {
      // Server actions may not be available yet
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setChecking(false);
    }
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!isSupported) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        toast.error("Chave VAPID não configurada. Notificações push não disponíveis.");
        setLoading(false);
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });

      const serializedSub = JSON.parse(JSON.stringify(sub));
      const result = await subscribeUserAction(serializedSub);

      if (result.success) {
        setIsSubscribed(true);
        setSubscriptionCount(1);
        toast.success("Notificações ativadas", {
          description: "Você receberá alertas mesmo com o app fechado.",
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações.",
      );
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        await unsubscribeUserAction(sub.endpoint);
      }

      setIsSubscribed(false);
      setSubscriptionCount(0);
      toast.success("Notificações desativadas");
    } catch (error) {
      toast.error("Não foi possível desativar as notificações.");
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem para o teste.");
      return;
    }
    setLoading(true);
    try {
      const result = await sendTestNotificationAction(message);
      if (result.success) {
        toast.success("Notificação enviada!", {
          description: `${result.sent} de ${result.total} dispositivos notificados.`,
        });
        setMessage("");
      } else {
        toast.error(result.error || "Falha ao enviar notificação.");
      }
    } catch (error) {
      toast.error("Erro ao enviar notificação de teste.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-border bg-card shadow-none">
        <CardContent className="p-4 text-center">
          <div className="flex flex-col items-center gap-2 py-4">
            <Bell className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Notificações push não são suportadas neste navegador.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Atualize para um navegador moderno como Chrome, Edge ou Safari 16.4+.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checking) {
    return (
      <Card className="border-border bg-card shadow-none">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Verificando status das notificações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
    >
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <BellRinging className="size-4 text-primary" weight="fill" />
              ) : (
                <Bell className="size-4 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-sm font-semibold">Notificações Push</CardTitle>
                <CardDescription className="text-xs">
                  {isSubscribed
                    ? `Ativo em ${subscriptionCount} ${subscriptionCount === 1 ? "dispositivo" : "dispositivos"}`
                    : "Receba alertas mesmo com o app fechado"}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={isSubscribed ? "success" : "outline"}
              className="gap-1.5 rounded-md text-[10px]"
            >
              <span
                className={`inline-block size-1.5 rounded-full ${
                  isSubscribed ? "bg-success" : "bg-muted-foreground"
                }`}
              />
              {isSubscribed ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSubscribed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/[0.03] px-3 py-2">
                <CheckCircle className="size-4 text-success" weight="fill" />
                <p className="text-xs text-muted-foreground">
                  Você receberá alertas de novos leads, tarefas e mensagens.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Mensagem para notificação de teste"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-9 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendTestNotification();
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={sendTestNotification}
                  disabled={loading || !message.trim()}
                  className="whitespace-nowrap"
                >
                  {loading ? "Enviando..." : "Testar"}
                </Button>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={unsubscribe}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Desativando..." : "Desativar notificações"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs leading-5 text-muted-foreground">
                Ative as notificações push para receber alertas de novos leads,
                tarefas urgentes e mensagens mesmo quando o CorreTop não estiver aberto.
              </p>
              <Button
                size="sm"
                onClick={subscribe}
                disabled={loading}
                className="w-full gap-1.5"
              >
                {loading ? (
                  "Ativando..."
                ) : (
                  <>
                    <BellRinging className="size-3.5" />
                    Ativar notificações
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
