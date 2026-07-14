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

export function TeamInviteSection({ branches, canInviteManager }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTeamUserAction({ success: false }, formData);
      if (result.success) { toast.success("Acesso criado com sucesso."); formRef.current?.reset(); setOpen(false); router.refresh(); }
      else toast.error("Não foi possível criar o acesso", { description: result.error });
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button><UserPlus weight="bold" /> Novo membro</Button>} /><DialogPopup className="sm:max-w-md"><DialogTitle>Novo membro</DialogTitle><DialogDescription>Crie um acesso para Gestor ou Corretor dentro da filial selecionada.</DialogDescription><form ref={formRef} action={handleSubmit} className="grid gap-4"><Field><FieldLabel htmlFor="user-name">Nome</FieldLabel><Input id="user-name" name="name" required disabled={pending} /></Field><Field><FieldLabel htmlFor="user-email">E-mail</FieldLabel><Input id="user-email" name="email" type="email" required disabled={pending} /></Field><Field><FieldLabel htmlFor="user-password">Senha inicial</FieldLabel><Input id="user-password" name="password" type="password" minLength={8} required disabled={pending} /></Field><Field><FieldLabel>Papel</FieldLabel><Select name="role" defaultValue={canInviteManager ? "manager" : "broker"} disabled={pending}><SelectTrigger className="w-full"><SelectValue placeholder="Selecione o papel" /></SelectTrigger><SelectContent>{canInviteManager ? <><SelectItem value="manager">Gestor</SelectItem><SelectItem value="broker">Corretor</SelectItem></> : <SelectItem value="broker">Corretor</SelectItem>}</SelectContent></Select></Field><Field><FieldLabel>Filial</FieldLabel><Select name="branchId" disabled={pending}><SelectTrigger className="w-full"><SelectValue placeholder="Selecione a filial" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></Field><Button type="submit" disabled={pending}>{pending ? "Criando acesso..." : "Criar acesso"}</Button></form><DialogClose render={<Button variant="ghost" className="w-full" disabled={pending}>Cancelar</Button>} /></DialogPopup></Dialog>;
}
