"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Branch = { id: string; name: string };

export function LeadsFilters({ initialSearch, initialStatus, initialBranch, branches }: { initialSearch?: string; initialStatus?: string; initialBranch?: string; branches: Branch[] }) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [branch, setBranch] = useState(initialBranch ?? "");
  useEffect(() => { const saved = localStorage.getItem("corretop-leads-filters"); if (!saved) return; try { const value = JSON.parse(saved) as { search?: string; status?: string; branch?: string }; if (!initialSearch && value.search) setSearch(value.search); if (!initialStatus && value.status) setStatus(value.status); if (!initialBranch && value.branch) setBranch(value.branch); } catch { /* ignore malformed local preference */ } }, [initialBranch, initialSearch, initialStatus]);
  function save() { localStorage.setItem("corretop-leads-filters", JSON.stringify({ search, status, branch })); }
  return <form className="flex w-full flex-col gap-2 sm:flex-row" method="get" onSubmit={save}><Input aria-label="Buscar leads" className="h-8 flex-1 bg-muted" name="search" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou telefone" value={search} /><select aria-label="Status" className="h-8 rounded-lg border border-input bg-muted px-2 text-sm" name="status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos os status</option><option value="new">Novos</option><option value="distributed">Distribuídos</option><option value="in_contact">Em atendimento</option><option value="converted">Convertidos</option><option value="lost">Perdidos</option></select>{branches.length ? <select aria-label="Filial" className="h-8 rounded-lg border border-input bg-muted px-2 text-sm" name="branch" onChange={(event) => setBranch(event.target.value)} value={branch}><option value="">Todas as filiais</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : null}<Button size="sm" type="submit" variant="outline">Aplicar e salvar</Button></form>;
}
