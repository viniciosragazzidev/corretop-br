"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); } if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const value = query.trim(); if (value) router.push(`/leads?search=${encodeURIComponent(value)}`); setOpen(false); }
  return <>{open ? <div className="fixed inset-0 z-40 flex items-start justify-center bg-background/80 p-4 pt-[18vh] backdrop-blur-sm" onClick={() => setOpen(false)}><form className="w-full max-w-lg rounded-xl border border-border bg-card p-3 shadow-xl" onClick={(event) => event.stopPropagation()} onSubmit={submit}><div className="flex items-center gap-2"><MagnifyingGlass className="size-4 text-muted-foreground" /><Input autoFocus className="border-0 bg-transparent shadow-none focus-visible:ring-0" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar leads, clientes ou equipe..." value={query} /></div><p className="mt-2 px-2 text-xs text-muted-foreground">Enter para abrir resultados em Leads · Esc para fechar</p></form></div> : null}<Button aria-label="Busca global (Ctrl K)" className="hidden gap-2 text-muted-foreground md:flex" onClick={() => setOpen(true)} size="sm" variant="outline"><MagnifyingGlass /> Buscar <kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd></Button></>;
}
