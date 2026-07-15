"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Branch = { id: string; name: string };
type SavedLeadFilter = { id: string; name: string; search: string; status: string; branch: string };

export function LeadsFilters({ initialSearch, initialStatus, initialBranch, branches, storageKey }: { initialSearch?: string; initialStatus?: string; initialBranch?: string; branches: Branch[]; storageKey: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [branch, setBranch] = useState(initialBranch ?? "");
  const [savedFilters, setSavedFilters] = useState<SavedLeadFilter[]>([]);
  const [filterName, setFilterName] = useState("");
  const storage = `corretop-leads-filters:${storageKey}`;

  useEffect(() => {
    const raw = localStorage.getItem(storage);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SavedLeadFilter[];
      if (Array.isArray(parsed)) setSavedFilters(parsed);
    } catch { /* ignore malformed local preference */ }
  }, [storage]);

  function queryFor(next: { search: string; status: string; branch: string }) {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.status) params.set("status", next.status);
    if (next.branch) params.set("branch", next.branch);
    return params.toString();
  }

  function applySaved(id: string) {
    const saved = savedFilters.find((item) => item.id === id);
    if (!saved) return;
    const query = queryFor(saved);
    router.push(`/leads${query ? `?${query}` : ""}`);
  }

  function saveCurrent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = filterName.trim();
    if (!name) { toast.error("Dê um nome para este filtro."); return; }
    const next: SavedLeadFilter = { id: crypto.randomUUID(), name, search, status, branch };
    const updated = [next, ...savedFilters.filter((item) => item.name.toLowerCase() !== name.toLowerCase())].slice(0, 12);
    localStorage.setItem(storage, JSON.stringify(updated));
    setSavedFilters(updated);
    setFilterName("");
    toast.success("Filtro salvo.");
  }

  function submitCurrent() {
    localStorage.setItem(storage, JSON.stringify(savedFilters));
  }

  return <div className="grid gap-2">
    <form className="flex w-full flex-col gap-2 sm:flex-row" method="get" onSubmit={submitCurrent}>
      <Input aria-label="Buscar leads" className="h-8 flex-1 bg-muted" name="search" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou telefone" value={search} />
      <select aria-label="Status" className="h-8 rounded-lg border border-input bg-muted px-2 text-sm" name="status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos os status</option><option value="new">Novos</option><option value="distributed">Distribuídos</option><option value="in_contact">Em atendimento</option><option value="converted">Convertidos</option><option value="lost">Perdidos</option></select>
      {branches.length ? <select aria-label="Filial" className="h-8 rounded-lg border border-input bg-muted px-2 text-sm" name="branch" onChange={(event) => setBranch(event.target.value)} value={branch}><option value="">Todas as filiais</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : null}
      <Button size="sm" type="submit" variant="outline">Aplicar</Button>
    </form>
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Filtros salvos" className="h-8 min-w-44 rounded-lg border border-input bg-background px-2 text-xs" defaultValue="" onChange={(event) => applySaved(event.target.value)}><option value="">Filtros salvos</option>{savedFilters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <form className="flex items-center gap-2" onSubmit={saveCurrent}><Input aria-label="Nome do novo filtro" className="h-8 w-44 bg-muted" onChange={(event) => setFilterName(event.target.value)} placeholder="Nome do filtro" value={filterName} /><Button size="sm" type="submit" variant="ghost">Salvar filtro</Button></form>
      {savedFilters.length ? <span className="text-[11px] text-muted-foreground">{savedFilters.length} filtro(s) deste usuário</span> : null}
    </div>
  </div>;
}
