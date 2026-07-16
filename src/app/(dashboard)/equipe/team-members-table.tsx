"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { UsersThree } from "@/components/huge-icons";

import { Badge } from "@/components/ui/badge";
import { MemberStatusBadge, RoleBadge } from "@/components/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamMemberActions } from "./member-actions";

type BranchOption = { id: string; name: string };
type TeamMember = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: "director" | "manager" | "broker";
  jobTitle: string;
  status: "pending" | "active" | "disabled";
  branchId: string | null;
  branchName: string | null;
};

type Props = {
  members: TeamMember[];
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

const jobTitleLabel: Record<string, string> = {
  director: "Diretor",
  manager: "Gestor",
  broker: "Corretor",
  marketing: "Marketing",
  finance: "Financeiro",
  operations: "Operações",
  support: "Suporte",
};

export function TeamMembersTable({ members, branches, currentRole, currentBranchId, currentUserId }: Props) {
  const [branchFilter, setBranchFilter] = useState("all");
  const visibleMembers = useMemo(
    () => branchFilter === "all" ? members : members.filter((member) => member.branchId === branchFilter),
    [branchFilter, members],
  );
  const activeCount = members.filter((member) => member.status === "active").length;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <UsersThree size={17} />
          Acessos vinculados
        </CardTitle>
        {currentRole === "director" ? <Select value={branchFilter} onValueChange={(value) => setBranchFilter(value ?? "all")} labels={{ all: "Todas as unidades", ...Object.fromEntries(branches.map((b) => [b.id, b.name])) }}><SelectTrigger aria-label="Filtrar colaboradores por unidade" className="w-full sm:w-56"><SelectValue placeholder="Todas as unidades" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as unidades</SelectItem>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select> : null}
        <CardDescription>{activeCount} acesso(s) ativo(s) · convites pendentes ficam sinalizados ate o primeiro login.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <p className="text-sm font-medium">Nenhum membro por enquanto</p>
            <p className="text-xs text-muted-foreground">Convide o primeiro gestor ou corretor para comecar a montar sua equipe.</p>
          </div>
        ) : (
          visibleMembers.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum colaborador nesta unidade.</div> : <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Membro</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody
              initial="hidden"
              animate="visible"
            >
              {visibleMembers.map((member, i) => (
                <motion.tr
                  key={member.id}
                  custom={i}
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: (index: number) => ({
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(index * 0.03, 0.25) },
                    }),
                  }}
                  className="group/card cursor-default transition-colors duration-200 hover:bg-[var(--sidebar-warning)]"
                >
                  <TableCell className="pl-5">
                    <p className="font-medium">{member.name ?? "Sem nome"}</p>
                    {member.userId === currentUserId ? <p className="text-xs text-muted-foreground">Você</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground">{member.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground">{member.branchName ?? "Sem filial"}</TableCell>
                  <TableCell>
                    <MemberStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="pr-5">
                    <TeamMemberActions
                      branches={branches}
                      currentBranchId={currentBranchId}
                      currentRole={currentRole}
                      currentUserId={currentUserId}
                      member={member}
                      allMembers={members}
                    />
                  </TableCell>
                </motion.tr>
              ))}
            </motion.tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
