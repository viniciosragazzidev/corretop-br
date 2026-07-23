import {
  Lightning,
  UserPlus,
  Phone,
  PaperPlaneTilt,
  Handshake,
  FileText,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { normalizeTeamMemberStatus, teamMemberStatusLabels } from "@/features/team/status";

export function LeadStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "new":
      return (
        <Badge variant="info" className="gap-1 px-2 py-0.5">
          <Lightning className="size-3 text-blue-500 fill-blue-500/10" />
          Novo
        </Badge>
      );
    case "distributed":
      return (
        <Badge variant="indigo" className="gap-1 px-2 py-0.5">
          <UserPlus className="size-3 text-indigo-500" />
          Distribuído
        </Badge>
      );
    case "in_contact":
      return (
        <Badge variant="warning" className="gap-1 px-2 py-0.5">
          <Phone className="size-3 text-warning" />
          Em contato
        </Badge>
      );
    case "quote_sent":
      return (
        <Badge variant="purple" className="gap-1 px-2 py-0.5">
          <PaperPlaneTilt className="size-3 text-purple-500" />
          Cotação
        </Badge>
      );
    case "negotiation":
      return (
        <Badge variant="pink" className="gap-1 px-2 py-0.5">
          <Handshake className="size-3 text-pink-500" />
          Negociação
        </Badge>
      );
    case "documentation_pending":
      return (
        <Badge variant="orange" className="gap-1 px-2 py-0.5">
          <FileText className="size-3 text-orange-500" />
          Documentos
        </Badge>
      );
    case "under_analysis":
      return (
        <Badge variant="cyan" className="gap-1 px-2 py-0.5">
          <MagnifyingGlass className="size-3 text-cyan-500" />
          Em análise
        </Badge>
      );
    case "converted":
      return (
        <Badge variant="success" className="gap-1 px-2 py-0.5">
          <CheckCircle className="size-3 text-success fill-success/10" />
          Convertido
        </Badge>
      );
    case "lost":
      return (
        <Badge variant="destructive" className="gap-1 px-2 py-0.5">
          <XCircle className="size-3 text-destructive" />
          Perdido
        </Badge>
      );
    default:
      return <Badge variant="outline" className="px-2 py-0.5">{status}</Badge>;
  }
}

export function MemberStatusBadge({ status }: { status: "active" | "pending" | "inactive" | string }) {
  switch (normalizeTeamMemberStatus(status)) {
    case "active":
      return (
        <Badge variant="success" className="gap-1.5 px-2.5 py-0.5 border-emerald-500/15">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Ativo
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="warning" className="gap-1.5 px-2.5 py-0.5 border-amber-500/15">
          <Clock className="size-3 text-amber-500" />
          Pendente
        </Badge>
      );
    case "disabled":
      return (
        <Badge variant="destructive" className="gap-1.5 px-2.5 py-0.5 border-red-500/15">
          <XCircle className="size-3 text-red-500" />
          {teamMemberStatusLabels.disabled}
        </Badge>
      );
    default:
      return <Badge variant="outline" className="px-2.5 py-0.5">{teamMemberStatusLabels.disabled}</Badge>;
  }
}

export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "director":
      return (
        <Badge variant="purple" className="gap-1 px-2 py-0.5 font-medium border-purple-500/15">
          <ShieldCheck className="size-3 text-purple-600 dark:text-purple-400" />
          Diretor
        </Badge>
      );
    case "manager":
      return (
        <Badge variant="indigo" className="gap-1 px-2 py-0.5 font-medium border-indigo-500/15">
          Gestor
        </Badge>
      );
    case "broker":
      return (
        <Badge variant="outline" className="gap-1 px-2 py-0.5 font-medium text-muted-foreground">
          Corretor
        </Badge>
      );
    default:
      return <Badge variant="outline" className="px-2 py-0.5">{role}</Badge>;
  }
}
