"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus } from "@/components/huge-icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTeamUserAction } from "./actions";

type Props = { branches: { id: string; name: string }[]; canInviteManager: boolean };

const jobTitles = [
  { value: "manager", label: "Gestor" },
  { value: "broker", label: "Corretor" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Financeiro" },
  { value: "operations", label: "Operações" },
  { value: "support", label: "Suporte" },
] as const;

export function TeamInviteSection({ branches, canInviteManager }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTeamUserAction({ success: false }, formData);
      if (result.success) {
        toast.success("Acesso criado com sucesso.");
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Não foi possível criar o acesso", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><UserPlus weight="bold" /> Novo membro</Button>} />
      <DialogPopup className="sm:max-w-md">
        <DialogTitle>Novo membro</DialogTitle>
        <DialogDescription>Escolha o cargo, o perfil de acesso e a unidade deste colaborador.</DialogDescription>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <Field><FieldLabel htmlFor="user-name">Nome</FieldLabel><Input id="user-name" name="name" required disabled={pending} /></Field>
          <Field><FieldLabel htmlFor="user-email">E-mail</FieldLabel><Input id="user-email" name="email" type="email" required disabled={pending} /></Field>
          <Field><FieldLabel htmlFor="user-password">Senha inicial</FieldLabel><Input id="user-password" name="password" type="password" minLength={8} required disabled={pending} /></Field>
          <Field>
            <FieldLabel>Cargo</FieldLabel>
            <Select name="jobTitle" defaultValue="broker" disabled={pending} labels={Object.fromEntries(jobTitles.map((t) => [t.value, t.label]))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
              <SelectContent>{jobTitles.filter((item) => canInviteManager || item.value !== "manager").map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Perfil de acesso</FieldLabel>
            <Select name="role" defaultValue={canInviteManager ? "manager" : "broker"} disabled={pending} labels={{ manager: "Gestão da unidade", broker: "Operação individual" }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
              <SelectContent>
                {canInviteManager ? <SelectItem value="manager">Gestão da unidade</SelectItem> : null}
                <SelectItem value="broker">Operação individual</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Unidade</FieldLabel>
            <Select name="branchId" required disabled={pending}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
              <SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>{pending ? "Criando acesso..." : "Criar acesso"}</Button>
        </form>
        <DialogClose render={<Button variant="ghost" className="w-full" disabled={pending}>Cancelar</Button>} />
      </DialogPopup>
    </Dialog>
  );
}
