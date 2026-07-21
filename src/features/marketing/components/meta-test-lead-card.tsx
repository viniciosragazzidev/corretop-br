"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetaTestLeadAction, deleteMetaTestLeadAction } from "@/features/marketing/test-lead-actions";

export function MetaTestLeadCard({ connectionId, defaultFormId }: { connectionId: string; defaultFormId?: string | null }) {
  const [formId, setFormId] = useState(defaultFormId ?? "");
  const [leadId, setLeadId] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action: (data: FormData) => Promise<{ success?: boolean; error?: string; leadId?: string }>, includeLead = false) {
    setBusy(true);
    try {
      const data = new FormData(); data.set("connectionId", connectionId); data.set("formId", formId); if (includeLead) data.set("leadId", leadId);
      const result = await action(data);
      if (!result.success) { toast.error(result.error ?? "Não foi possível concluir o teste."); return; }
      if (result.leadId) setLeadId(result.leadId);
      toast.success(includeLead ? "Lead de teste excluído." : `Lead de teste criado: ${result.leadId}`);
    } finally { setBusy(false); }
  }
  return <Card>
    <CardHeader><CardTitle>Testar recebimento de Lead Ads</CardTitle><CardDescription>Crie um lead fictício pela API oficial da Meta. O token da Página permanece somente no servidor.</CardDescription></CardHeader>
    <CardContent className="grid gap-4">
      <div className="grid gap-2"><label htmlFor="meta-test-form">ID do formulário</label><Input id="meta-test-form" value={formId} onChange={(event) => setFormId(event.target.value)} placeholder="Ex.: 1234567890" /></div>
      <div className="flex flex-wrap gap-2"><Button disabled={busy || !formId} onClick={() => run(createMetaTestLeadAction)}>Criar lead de teste</Button><Button variant="outline" disabled={busy || !formId || !leadId} onClick={() => run(deleteMetaTestLeadAction, true)}>Excluir lead para repetir</Button><a className="inline-flex h-9 items-center rounded-md px-3 text-sm text-primary underline-offset-4 hover:underline" href="https://developers.facebook.com/tools/lead-ads-testing" target="_blank" rel="noreferrer">Abrir ferramenta da Meta</a></div>
      {leadId ? <p className="text-xs text-muted-foreground">Último lead: <code>{leadId}</code>. Aguarde o webhook e confira em Leads.</p> : null}
    </CardContent>
  </Card>;
}
