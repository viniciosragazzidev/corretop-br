"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PencilSimple, Plus, Power } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBranchAction, toggleBranchAction, updateBranchAction, type BranchActionState } from "@/features/branches/actions";

type Branch = { id: string; name: string; externalId: string | null; status: "active" | "inactive"; memberCount: number };

function ActionFeedback({ state }: { state: BranchActionState }) {
  useEffect(() => {
    if (state.success) toast.success("Filial atualizada com sucesso.");
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);
  return null;
}

function CreateBranchForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, pending] = useActionState<BranchActionState, FormData>(createBranchAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="branch-name">Nome da filial</Label><Input id="branch-name" name="name" placeholder="Ex.: Unidade Centro" required /></div>
      <div className="space-y-2"><Label htmlFor="branch-external-id">Identificador externo <span className="text-muted-foreground">(opcional)</span></Label><Input id="branch-external-id" name="externalId" placeholder="Ex.: centro-01" /></div>
      <Button className="w-full" type="submit" disabled={pending}>{pending ? "Criando..." : "Criar filial"}</Button>
      <ActionFeedback state={state} />
    </form>
  );
}

function CreateBranchSheet() {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger render={<Button><Plus weight="bold" /> Nova filial</Button>} /><SheetContent className="w-full sm:max-w-md"><SheetHeader><SheetTitle>Nova filial</SheetTitle><SheetDescription>Crie uma unidade para organizar equipe e leads.</SheetDescription></SheetHeader><div className="px-4 pb-6"><CreateBranchForm onSuccess={() => setOpen(false)} /></div></SheetContent></Sheet>;
}

function BranchRow({ branch }: { branch: Branch }) {
  const [updateState, updateAction, updatePending] = useActionState<BranchActionState, FormData>(updateBranchAction, {});
  const [toggleState, toggleAction, togglePending] = useActionState<BranchActionState, FormData>(toggleBranchAction, {});
  const updateFormId = `branch-update-${branch.id}`;
  return (
    <TableRow>
      <TableCell className="min-w-56 pl-5"><form id={updateFormId} action={updateAction} className="flex items-center gap-2"><input type="hidden" name="branchId" value={branch.id} /><Input aria-label={`Nome da filial ${branch.name}`} name="name" defaultValue={branch.name} required /><Button aria-label={`Salvar ${branch.name}`} type="submit" variant="ghost" size="icon-sm" disabled={updatePending}><PencilSimple size={15} /></Button></form><ActionFeedback state={updateState} /></TableCell>
      <TableCell className="min-w-40"><Input form={updateFormId} aria-label={`Identificador de ${branch.name}`} name="externalId" defaultValue={branch.externalId ?? ""} placeholder="Sem ID" /></TableCell>
      <TableCell><span className="text-sm">{branch.memberCount}</span><span className="ml-1 text-xs text-muted-foreground">membro(s)</span></TableCell>
      <TableCell><Badge variant="outline" className={branch.status === "active" ? "border-emerald-500/40 text-emerald-500" : "text-muted-foreground"}>{branch.status === "active" ? "Ativa" : "Inativa"}</Badge></TableCell>
      <TableCell className="pr-5 text-right"><form action={toggleAction}><input type="hidden" name="branchId" value={branch.id} /><Button type="submit" size="sm" variant="ghost" disabled={togglePending}><Power size={15} />{branch.status === "active" ? "Desativar" : "Ativar"}</Button></form><ActionFeedback state={toggleState} /></TableCell>
    </TableRow>
  );
}

export function BranchesManager({ branches }: { branches: Branch[] }) {
  const activeCount = branches.filter((branch) => branch.status === "active").length;
  const memberCount = branches.reduce((total, branch) => total + branch.memberCount, 0);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm" className="border-border bg-card shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de filiais</p><p className="mt-2 font-mono text-2xl font-semibold">{branches.length}</p></CardContent></Card>
        <Card size="sm" className="border-border bg-card shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Filiais ativas</p><p className="mt-2 font-mono text-2xl font-semibold">{activeCount}</p></CardContent></Card>
        <Card size="sm" className="border-border bg-card shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Equipe vinculada</p><p className="mt-2 font-mono text-2xl font-semibold">{memberCount}</p></CardContent></Card>
      </div>
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between"><div><CardTitle>Filiais da corretora</CardTitle><CardDescription>Edite dados, acompanhe a equipe vinculada e altere o status operacional.</CardDescription></div><CreateBranchSheet /></CardHeader>
        <CardContent className="p-0">
          {branches.length === 0 ? <div className="flex flex-col items-center gap-2 p-12 text-center"><p className="text-sm font-medium">Nenhuma filial por enquanto</p><p className="text-xs text-muted-foreground">Crie a primeira unidade para começar a organizar sua operação.</p></div> : <Table><TableHeader><TableRow><TableHead className="pl-5">Filial</TableHead><TableHead>Identificador</TableHead><TableHead>Equipe</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{branches.map((branch) => <BranchRow key={branch.id} branch={branch} />)}</TableBody></Table>}
        </CardContent>
      </Card>
    </>
  );
}
