"use client";

import { UsersThree } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamMemberActions } from "./member-actions";

type BranchOption = { id: string; name: string };
type TeamMember = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: "director" | "manager" | "broker";
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

export function TeamMembersTable({ members, branches, currentRole, currentBranchId, currentUserId }: Props) {
  const activeCount = members.filter((member) => member.status === "active").length;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <UsersThree size={17} />
          Acessos vinculados
        </CardTitle>
        <CardDescription>{activeCount} acesso(s) ativo(s) · convites pendentes ficam sinalizados ate o primeiro login.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <p className="text-sm font-medium">Nenhum membro por enquanto</p>
            <p className="text-xs text-muted-foreground">Convide o primeiro gestor ou corretor para comecar a montar sua equipe.</p>
          </div>
        ) : (
          <Table>
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
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="pl-5">
                    <p className="font-medium">{member.name ?? "Sem nome"}</p>
                    {member.userId === currentUserId ? <p className="text-xs text-muted-foreground">Você</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{roleLabel[member.role]}</TableCell>
                  <TableCell className="text-muted-foreground">{member.branchName ?? "Sem filial"}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === "active" ? "default" : member.status === "pending" ? "secondary" : "outline"}>{statusLabel[member.status]}</Badge>
                  </TableCell>
                  <TableCell className="pr-5">
                    <TeamMemberActions
                      branches={branches}
                      currentBranchId={currentBranchId}
                      currentRole={currentRole}
                      currentUserId={currentUserId}
                      member={member}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
