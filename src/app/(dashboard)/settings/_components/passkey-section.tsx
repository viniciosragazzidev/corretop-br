"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, LockKey, PencilSimple, Plus, Trash } from "@/components/huge-icons";

import { authClient } from "@/shared/auth/client";
import { recordSecurityAuditAction } from "../security-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Passkey = {
  id: string;
  name: string | null;
  userId: string;
  publicKey: string;
  credentialID: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports: string | null;
  aaguid: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const DEVICE_LABELS: Record<string, string> = {
  platform: "Dispositivo",
  "cross-platform": "Chave de segurança",
};

export function PasskeySection() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [name, setName] = useState("");
  const [attachmentType, setAttachmentType] = useState<"platform" | "cross-platform" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const result = await authClient.passkey.listUserPasskeys();
    if (result.data) setPasskeys(result.data as unknown as Passkey[]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addPasskey() {
    setBusy("add");
    try {
      const result = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
        authenticatorAttachment: attachmentType || undefined,
      });
      if (result.error) throw new Error(result.error.message ?? "Não foi possível criar a chave.");
      await recordSecurityAuditAction("cadastrou_passkey");
      toast.success("Passkey cadastrada com sucesso.");
      setName("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a chave.");
    } finally {
      setBusy("");
    }
  }

  async function renamePasskey() {
    if (!editingId || !editingName.trim()) return;
    setBusy("rename");
    try {
      const result = await authClient.passkey.updatePasskey({
        id: editingId,
        name: editingName.trim(),
      });
      if (result.error) throw new Error(result.error.message ?? "Não foi possível renomear.");
      await recordSecurityAuditAction("renomeou_passkey");
      toast.success("Chave renomeada.");
      setEditingId(null);
      setEditingName("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível renomear.");
    } finally {
      setBusy("");
    }
  }

  async function deletePasskey(id: string, label: string) {
    setBusy(id);
    try {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error) throw new Error(result.error.message ?? "Não foi possível excluir.");
      await recordSecurityAuditAction("excluiu_passkey");
      toast.success(`"${label}" removida.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-4">
      {/* Add passkey */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="passkey-name">
            Nome da chave (opcional)
          </label>
          <Input
            id="passkey-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Meu celular"
            className="w-60"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="passkey-type">
            Tipo de chave
          </label>
          <select
            id="passkey-type"
            value={attachmentType}
            onChange={(e) => setAttachmentType(e.target.value as "platform" | "cross-platform" | "")}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Automático (recomendado)</option>
            <option value="platform">Dispositivo (biometria / PIN)</option>
            <option value="cross-platform">Chave de segurança / outro dispositivo</option>
          </select>
        </div>
        <Button type="button" onClick={addPasskey} disabled={busy === "add"}>
          <Plus size={16} />
          {busy === "add" ? "Cadastrando..." : "Cadastrar passkey"}
        </Button>
      </div>

      {/* Passkey list */}
      {passkeys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <LockKey className="mx-auto mb-2 size-6 opacity-40" />
          <p className="font-medium">Nenhuma passkey cadastrada</p>
          <p className="mt-1 text-xs">Use o botão acima para adicionar uma chave de acesso (biometria, PIN ou chave de segurança).</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {passkeys.map((pk) => {
            const label = pk.name || "Passkey";
            const isEditing = editingId === pk.id;

            return (
              <div
                key={pk.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LockKey className="size-5 shrink-0 text-muted-foreground" size={20} />
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 w-44"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renamePasskey();
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingName("");
                            }
                          }}
                        />
                        <Button size="sm" variant="default" onClick={renamePasskey} disabled={busy === "rename"}>
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium truncate max-w-48">{label}</p>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {DEVICE_LABELS[pk.deviceType] ?? pk.deviceType}
                      </Badge>
                      {pk.backedUp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                          <CheckCircle size={10} weight="fill" /> Backup
                        </span>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground">
                        Criada em {formatDate(pk.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Renomear"
                      onClick={() => {
                        setEditingId(pk.id);
                        setEditingName(pk.name || "");
                      }}
                    >
                      <PencilSimple size={14} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Excluir"
                      disabled={busy === pk.id}
                      onClick={() => {
                        if (window.confirm(`Remover a passkey "${label}"?`)) {
                          deletePasskey(pk.id, label);
                        }
                      }}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
