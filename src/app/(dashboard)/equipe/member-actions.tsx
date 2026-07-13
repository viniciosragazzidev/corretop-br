"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { DotsThreeVertical, PencilSimple, Power, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTeamMemberAction, toggleTeamMemberStatusAction, updateTeamMemberAction, type TeamActionState } from "./actions";

type BranchOption = { id: string; name: string };
type TeamMember = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: "director" | "manager" | "broker";
  status: "pending" | "active" | "disabled";
  branchId: string | null;
  branchName: string | null;
};

type Props = {
  member: TeamMember;
  branches: BranchOption[];
  currentRole: "director" | "manager" | "broker";
  currentBranchId: string | null;
  currentUserId: string;
};

const roleLabel: Record<TeamMember["role"], string> = {
  director: "Diretor",
  manager: "Gestor",
  broker: "Corretor",
};

const statusLabel: Record<TeamMember["status"], string> = {
  active: "Ativo",
  pending: "Pendente",
  disabled: "Desativado",
};

function EditMemberDialog({
  member,
  open,
  onOpenChange,
  branches,
  currentRole,
  currentBranchId,
}: Props & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    updateTeamMemberAction,
    {},
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const allowedBranches =
    currentRole === "manager" && currentBranchId
      ? branches.filter((branch) => branch.id === currentBranchId)
      : branches;
  const roleOptions =
    currentRole === "director"
      ? (["manager", "broker"] as const)
      : (["broker"] as const);

  useEffect(() => {
    if (state.success) {
      toast.success("Membro atualizado com sucesso.");
      onOpenChange(false);
      formRef.current?.reset();
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [onOpenChange, router, state.error, state.success]);

  useEffect(() => {
    if (!open) formRef.current?.reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg">
        <DialogTitle>Editar membro</DialogTitle>
        <DialogDescription>
          Atualize os dados, a filial e o papel operacional desse acesso.
        </DialogDescription>
        <form ref={formRef} action={action} className="grid gap-4">
          <input name="memberId" type="hidden" value={member.id} />
          <Field>
            <FieldLabel htmlFor={`member-name-${member.id}`}>Nome</FieldLabel>
            <Input
              id={`member-name-${member.id}`}
              name="name"
              defaultValue={member.name ?? ""}
              disabled={pending}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`member-email-${member.id}`}>E-mail</FieldLabel>
            <Input
              id={`member-email-${member.id}`}
              name="email"
              defaultValue={member.email}
              disabled={pending}
              required
              type="email"
            />
          </Field>
          <Field>
            <FieldLabel>Papel</FieldLabel>
            <Select
              defaultValue={
                currentRole === "director" && member.role === "manager"
                  ? "manager"
                  : "broker"
              }
              disabled={pending || roleOptions.length === 1}
              name="role"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o papel">{(value: string | null) => roleLabel[value as TeamMember["role"]] ?? "Selecione o papel"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabel[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Filial</FieldLabel>
            <Select
              defaultValue={member.branchId ?? allowedBranches[0]?.id ?? ""}
              disabled={pending || allowedBranches.length === 1}
              name="branchId"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a filial">{(value: string | null) => allowedBranches.find((branch) => branch.id === value)?.name ?? "Selecione a filial"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allowedBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={pending} type="submit">
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
            <DialogClose
              render={
                <Button
                  className="flex-1"
                  disabled={pending}
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              }
            />
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

function DeleteMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    deleteTeamMemberAction,
    {},
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Membro removido com sucesso.");
      onOpenChange(false);
      formRef.current?.reset();
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [onOpenChange, router, state.error, state.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogTitle>Excluir membro</DialogTitle>
        <DialogDescription>
          Essa ação remove o acesso, a associação de equipe e o login do membro.
        </DialogDescription>
        <form ref={formRef} action={action} className="space-y-4">
          <input name="memberId" type="hidden" value={member.id} />
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">{member.name ?? "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{roleLabel[member.role]}</Badge>
              <Badge
                variant={
                  member.status === "active"
                    ? "default"
                    : member.status === "pending"
                      ? "secondary"
                      : "outline"
                }
              >
                {statusLabel[member.status]}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Confirme para remover esse membro definitivamente.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={pending}
              type="submit"
              variant="destructive"
            >
              {pending ? "Excluindo..." : "Excluir membro"}
            </Button>
            <DialogClose
              render={
                <Button
                  className="flex-1"
                  disabled={pending}
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              }
            />
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

export function TeamMemberActions({
  member,
  branches,
  currentRole,
  currentBranchId,
  currentUserId,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toggleState, toggleAction, togglePending] = useActionState<
    TeamActionState,
    FormData
  >(toggleTeamMemberStatusAction, {});
  const router = useRouter();

  useEffect(() => {
    if (toggleState.success) {
      toast.success(
        member.status === "active"
          ? "Membro desativado."
          : "Membro reativado.",
      );
      router.refresh();
    }
    if (toggleState.error) toast.error(toggleState.error);
  }, [member.status, router, toggleState.error, toggleState.success]);

  const canEdit = currentUserId !== member.userId && member.role !== "director";
  const canDelete = canEdit;
  const canToggle = canEdit;
  const toggleLabel = member.status === "active" ? "Desativar" : "Ativar";

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {canEdit ? (
          <Button
            aria-label={`Editar ${member.name ?? member.email}`}
            onClick={() => setEditOpen(true)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <PencilSimple size={15} />
          </Button>
        ) : null}
        {canToggle ? (
          <form action={toggleAction}>
            <input name="memberId" type="hidden" value={member.id} />
            <Button
              aria-label={`${toggleLabel} ${member.name ?? member.email}`}
              disabled={togglePending}
              size="icon-sm"
              type="submit"
              variant="ghost"
            >
              <Power size={15} />
            </Button>
          </form>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={`Acoes de ${member.name ?? member.email}`}
                size="icon-sm"
                variant="ghost"
              >
                <DotsThreeVertical size={15} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!canDelete}
              onClick={() => setDeleteOpen(true)}
              variant="destructive"
            >
              <Trash size={15} />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditMemberDialog
        key={member.id}
        branches={branches}
        currentBranchId={currentBranchId}
        currentRole={currentRole}
        currentUserId={currentUserId}
        member={member}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteMemberDialog
        key={`${member.id}-delete`}
        member={member}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
