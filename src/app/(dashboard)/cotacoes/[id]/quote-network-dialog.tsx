"use client";

import { useMemo, useState } from "react";

import { Buildings, MagnifyingGlass } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPopup, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Network = { name: string; city: string; specialty: string | null };

export function QuoteNetworkDialog({ planName, networks }: { planName: string; networks: Network[] }) {
  const [search, setSearch] = useState("");
  const visibleNetworks = useMemo(() => networks.filter((network) => `${network.name} ${network.city} ${network.specialty ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [networks, search]);
  return <Dialog><DialogTrigger render={<Button size="sm" variant="outline"><Buildings /> Redes credenciadas</Button>} /><DialogPopup className="max-h-[85vh] sm:max-w-2xl"><DialogHeader><DialogTitle>Rede credenciada</DialogTitle><DialogDescription>{planName} · hospitais, clínicas e laboratórios cadastrados no catálogo.</DialogDescription></DialogHeader><div className="relative"><MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por local, cidade ou especialidade" value={search} /></div><div className="max-h-80 overflow-y-auto rounded-lg border border-border"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted/80 text-left text-xs text-muted-foreground"><tr><th className="p-3 font-medium">Local</th><th className="p-3 font-medium">Cidade</th><th className="p-3 font-medium">Especialidade</th></tr></thead><tbody>{visibleNetworks.map((network) => <tr className="border-t border-border" key={`${network.name}-${network.city}-${network.specialty ?? ""}`}><td className="p-3 font-medium">{network.name}</td><td className="p-3">{network.city}</td><td className="p-3 text-muted-foreground">{network.specialty ?? "Não informada"}</td></tr>)}</tbody></table>{!visibleNetworks.length ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma rede cadastrada para esta busca.</p> : null}</div><DialogFooter><DialogClose render={<Button variant="outline">Fechar</Button>} /></DialogFooter></DialogPopup></Dialog>;
}
