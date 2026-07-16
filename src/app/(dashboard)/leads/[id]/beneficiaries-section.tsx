"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addLeadBeneficiaryAction, removeLeadBeneficiaryAction } from "@/features/post-sale/actions";

type Beneficiary = { id: string; name: string; birthDate: string; relationship: string; isHolder: boolean };

export function BeneficiariesSection({ leadId, initialBeneficiaries }: { leadId: string; initialBeneficiaries: Beneficiary[] }) {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relationship, setRelationship] = useState<"titular" | "conjuge" | "filho" | "outro">("filho");
  const holderExists = beneficiaries.some((beneficiary) => beneficiary.isHolder);

  function add() {
    startTransition(async () => {
      const result = await addLeadBeneficiaryAction({ leadId, name, birthDate, relationship, isHolder: !holderExists });
      if (result.error) { toast.error(result.error); return; }
      setBeneficiaries((current) => [...current, { id: result.id!, name, birthDate, relationship: !holderExists ? "titular" : relationship, isHolder: !holderExists }]);
      setName(""); setBirthDate(""); toast.success("Beneficiário adicionado.");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await removeLeadBeneficiaryAction(id);
      if (result.error) { toast.error(result.error); return; }
      setBeneficiaries((current) => current.filter((beneficiary) => beneficiary.id !== id));
      toast.success("Beneficiário removido.");
    });
  }

  return <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle className="text-base">Beneficiários da contratação</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 sm:grid-cols-[1fr_10rem_9rem_auto] sm:items-end"><div className="space-y-1"><Label htmlFor="beneficiary-name">Nome</Label><Input id="beneficiary-name" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-1"><Label htmlFor="beneficiary-birth">Nascimento</Label><Input id="beneficiary-birth" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></div><div className="space-y-1"><Label htmlFor="beneficiary-relationship">Parentesco</Label><select id="beneficiary-relationship" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={relationship} onChange={(event) => setRelationship(event.target.value as typeof relationship)}><option value="conjuge">Cônjuge</option><option value="filho">Filho</option><option value="outro">Outro</option></select></div><Button type="button" disabled={pending || !name || !birthDate} onClick={add}>{holderExists ? "Adicionar" : "Criar titular"}</Button></div><div className="divide-y rounded-lg border">{beneficiaries.length ? beneficiaries.map((beneficiary) => <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm" key={beneficiary.id}><div><p className="font-medium">{beneficiary.name} {beneficiary.isHolder ? <span className="text-xs text-primary">· Titular</span> : null}</p><p className="text-xs text-muted-foreground">{beneficiary.birthDate} · {beneficiary.relationship}</p></div>{!beneficiary.isHolder ? <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => remove(beneficiary.id)}>Remover</Button> : null}</div>) : <p className="px-3 py-4 text-sm text-muted-foreground">Cadastre o titular e os dependentes para calcular a cotação e montar o checklist individual.</p>}</div></CardContent></Card>;
}
