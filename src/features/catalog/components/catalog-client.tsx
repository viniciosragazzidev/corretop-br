"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Buildings,
  PencilSimple,
  Plus,
  Power,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlanAction,
  deletePlanAction,
  getCarrierPlans,
  toggleCarrierAction,
  togglePlanAction,
  updateCarrierAction,
  updatePlanAction,
} from "@/features/catalog/actions";
import type { CatalogActionState } from "@/features/catalog/types";
import type { CarrierPlanRecord, CarrierRecord } from "@/features/catalog/types";

// ─── Action feedback ──────────────────────────────────────────────────────

function ActionFeedback({ state }: { state: CatalogActionState }) {
  useEffect(() => {
    if (state.success) toast.success("Operação concluída.");
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);
  return null;
}

// ─── Carrier Card ─────────────────────────────────────────────────────────

function CarrierCard({ carrier }: { carrier: CarrierRecord }) {
  const [toggleState, toggleAction, togglePending] = useActionState<
    CatalogActionState,
    FormData
  >(toggleCarrierAction, {});

  const isActive = carrier.status === "active";

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Buildings className="size-5 text-primary" weight="fill" />
        </div>
        <Badge
          variant="outline"
          className={`rounded-md text-xs ${
            isActive
              ? "border-emerald-500/40 text-emerald-500"
              : "text-muted-foreground"
          }`}
        >
          {isActive ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{carrier.name}</h3>
        {carrier.ansCode && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            ANS: {carrier.ansCode}
          </p>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {carrier.contact && (
          <p className="truncate">{carrier.contact}</p>
        )}
        {carrier.phone && <p className="truncate">{carrier.phone}</p>}
        {carrier.email && <p className="truncate">{carrier.email}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3">
        <span className="text-xs text-muted-foreground">
          {carrier.planCount} {carrier.planCount === 1 ? "plano" : "planos"}
        </span>
        <form
          action={toggleAction}
          onClick={(e) => e.stopPropagation()}
        >
          <input type="hidden" name="carrierId" value={carrier.id} />
          <Button
            type="submit"
            size="icon-sm"
            variant="ghost"
            disabled={togglePending}
            className="opacity-0 group-hover:opacity-100"
            title={isActive ? "Desativar" : "Ativar"}
          >
            <Power size={14} />
          </Button>
        </form>
      </div>
      <ActionFeedback state={toggleState} />
    </div>
  );
}

// ─── Plan Form ────────────────────────────────────────────────────────────

function PlanForm({
  carrierId,
  plan,
  onDone,
}: {
  carrierId: string;
  plan?: CarrierPlanRecord;
  onDone: () => void;
}) {
  const isEditing = !!plan;
  const action = isEditing ? updatePlanAction : createPlanAction;
  const [state, formAction, pending] = useActionState<CatalogActionState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="carrierId" value={carrierId} />
      {plan && <input type="hidden" name="planId" value={plan.id} />}

      <div className="space-y-2">
        <Label htmlFor="plan-name">Nome do plano</Label>
        <Input
          id="plan-name"
          name="name"
          defaultValue={plan?.name}
          placeholder="Ex.: Amil Fácil 300"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-type">Tipo</Label>
        <select
          id="plan-type"
          name="type"
          defaultValue={plan?.type ?? "individual"}
          className="flex h-8 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm"
        >
          <option value="individual">Individual</option>
          <option value="empresarial">Empresarial</option>
          <option value="familiar">Familiar</option>
          <option value="pme">PME</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-description">Descrição</Label>
        <Textarea
          id="plan-description"
          name="description"
          defaultValue={plan?.description ?? ""}
          placeholder="Descrição do plano, coberturas e diferenciais..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="plan-coverage">Abrangência</Label>
          <select
            id="plan-coverage"
            name="coverage"
            defaultValue={plan?.coverage ?? ""}
            className="flex h-8 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm"
          >
            <option value="">Selecione</option>
            <option value="Nacional">Nacional</option>
            <option value="Estadual">Estadual</option>
            <option value="Municipal">Municipal</option>
            <option value="Regional">Regional</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-ans">Registro ANS</Label>
          <Input
            id="plan-ans"
            name="ansRegistration"
            defaultValue={plan?.ansRegistration ?? ""}
            placeholder="Ex.: 12345"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-max-age">Idade máxima de entrada</Label>
        <Input
          id="plan-max-age"
          name="maxEntryAge"
          type="number"
          min={0}
          max={120}
          defaultValue={plan?.maxEntryAge ?? ""}
          placeholder="Ex.: 59"
        />
      </div>

      <Button className="w-full" type="submit" disabled={pending}>
        {pending
          ? "Salvando..."
          : isEditing
            ? "Salvar alterações"
            : "Criar plano"}
      </Button>
      <ActionFeedback state={state} />
    </form>
  );
}

// ─── Plans Table ──────────────────────────────────────────────────────────

function PlanRow({
  plan,
  onEdit,
}: {
  plan: CarrierPlanRecord;
  onEdit: () => void;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState<
    CatalogActionState,
    FormData
  >(togglePlanAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState<
    CatalogActionState,
    FormData
  >(deletePlanAction, {});

  const typeLabel = {
    individual: "Individual",
    empresarial: "Empresarial",
    familiar: "Familiar",
    pme: "PME",
  }[plan.type];

  return (
    <tr className="border-b border-border/40 hover:bg-muted/10">
      <td className="px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">{plan.name}</p>
          {plan.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {plan.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <Badge variant="outline" className="rounded-md text-xs">
          {typeLabel}
        </Badge>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {plan.coverage ?? "—"}
      </td>
      <td className="px-3 py-2.5">
        <Badge
          variant="outline"
          className={
            plan.active
              ? "border-emerald-500/40 text-emerald-500"
              : "text-muted-foreground"
          }
        >
          {plan.active ? "Ativo" : "Inativo"}
        </Badge>
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <form action={toggleAction}>
            <input type="hidden" name="planId" value={plan.id} />
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              disabled={togglePending}
              title={plan.active ? "Desativar" : "Ativar"}
            >
              <Power size={14} />
            </Button>
          </form>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onEdit}
            title="Editar"
          >
            <PencilSimple size={14} />
          </Button>
          <form action={deleteAction}>
            <input type="hidden" name="planId" value={plan.id} />
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              disabled={deletePending}
              className="text-destructive hover:text-destructive"
              title="Excluir"
            >
              <Trash size={14} />
            </Button>
          </form>
        </div>
        <ActionFeedback state={toggleState} />
        <ActionFeedback state={deleteState} />
      </td>
    </tr>
  );
}

// ─── Carrier Sheet (main detail view) ─────────────────────────────────────

export function CarrierSheet({
  carrier: initialCarrier,
}: {
  carrier: CarrierRecord;
}) {
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [plans, setPlans] = useState<CarrierPlanRecord[]>([]);
  const [editingPlan, setEditingPlan] = useState<CarrierPlanRecord | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  // Sync when initialCarrier changes
  useEffect(() => {
    setCarrier(initialCarrier);
  }, [initialCarrier]);

  // Load plans when opening
  useEffect(() => {
    if (open) {
      getCarrierPlans(carrier.id).then(setPlans);
      setEditingPlan(null);
      setShowCreatePlan(false);
    }
  }, [open, carrier.id]);

  const [updateState, updateAction, updatePending] = useActionState<
    CatalogActionState,
    FormData
  >(updateCarrierAction, {});

  useEffect(() => {
    if (updateState.success) {
      setOpen(false);
    }
  }, [updateState.success]);

  function refreshPlans() {
    getCarrierPlans(carrier.id).then(setPlans);
    setEditingPlan(null);
    setShowCreatePlan(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="group relative flex w-full flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 text-left shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Buildings className="size-5 text-primary" weight="fill" />
              </div>
              <Badge
                variant="outline"
                className={`rounded-md text-xs ${
                  carrier.status === "active"
                    ? "border-emerald-500/40 text-emerald-500"
                    : "text-muted-foreground"
                }`}
              >
                {carrier.status === "active" ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{carrier.name}</h3>
              {carrier.ansCode && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ANS: {carrier.ansCode}
                </p>
              )}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {carrier.contact && <p className="truncate">{carrier.contact}</p>}
              {carrier.phone && <p className="truncate">{carrier.phone}</p>}
              {carrier.email && <p className="truncate">{carrier.email}</p>}
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-xs text-muted-foreground">
                {carrier.planCount} {carrier.planCount === 1 ? "plano" : "planos"}
              </span>
            </div>
          </button>
        }
      />
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Buildings className="size-5 text-primary" weight="fill" />
            {carrier.name}
          </SheetTitle>
          <SheetDescription>
            Configure os dados da operadora e gerencie os planos disponíveis.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 pb-6">
          {/* Carrier data form */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Dados da Operadora
            </h3>
            <form action={updateAction} className="space-y-4">
              <input type="hidden" name="carrierId" value={carrier.id} />

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Nome (fixo)</p>
                <p className="mt-1 text-sm font-medium">{carrier.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="carrier-ans">Código ANS</Label>
                  <Input
                    id="carrier-ans"
                    name="ansCode"
                    defaultValue={carrier.ansCode ?? ""}
                    placeholder="Ex.: 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier-status">Status</Label>
                  <select
                    id="carrier-status"
                    name="status"
                    defaultValue={carrier.status}
                    className="flex h-8 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm"
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier-contact">Contato</Label>
                <Input
                  id="carrier-contact"
                  name="contact"
                  defaultValue={carrier.contact ?? ""}
                  placeholder="Nome do contato na operadora"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="carrier-phone">Telefone</Label>
                  <Input
                    id="carrier-phone"
                    name="phone"
                    defaultValue={carrier.phone ?? ""}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier-email">E-mail</Label>
                  <Input
                    id="carrier-email"
                    name="email"
                    type="email"
                    defaultValue={carrier.email ?? ""}
                    placeholder="contato@operadora.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier-notes">Observações</Label>
                <textarea
                  id="carrier-notes"
                  name="notes"
                  defaultValue={carrier.notes ?? ""}
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Informações internas sobre a operadora..."
                />
              </div>

              <Button
                className="w-full"
                type="submit"
                disabled={updatePending}
              >
                {updatePending ? "Salvando..." : "Salvar dados da operadora"}
              </Button>
              <ActionFeedback state={updateState} />
            </form>
          </section>

          {/* Plans section */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Planos
                </h3>
                <p className="text-xs text-muted-foreground">
                  {plans.length}{" "}
                  {plans.length === 1 ? "plano cadastrado" : "planos cadastrados"}
                </p>
              </div>
              {!showCreatePlan && !editingPlan && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreatePlan(true)}
                >
                  <Plus weight="bold" /> Novo plano
                </Button>
              )}
            </div>

            {(showCreatePlan || editingPlan) && (
              <Card className="mb-4 border-border/60 bg-muted/20 shadow-none">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {editingPlan ? "Editar plano" : "Novo plano"}
                    </h4>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingPlan(null);
                        setShowCreatePlan(false);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  <PlanForm
                    carrierId={carrier.id}
                    plan={editingPlan ?? undefined}
                    onDone={refreshPlans}
                  />
                </CardContent>
              </Card>
            )}

            {plans.length === 0 && !showCreatePlan ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
                <p className="text-sm font-medium">
                  Nenhum plano cadastrado
                </p>
                <p className="text-xs text-muted-foreground">
                  Adicione os planos que esta operadora oferece.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/60">
                <ScrollArea className="max-h-80">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/60 bg-muted/20 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Plano</th>
                        <th className="px-3 py-2 text-left font-medium">Tipo</th>
                        <th className="px-3 py-2 text-left font-medium">Abrang.</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <PlanRow
                          key={plan.id}
                          plan={plan}
                          onEdit={() => {
                            setEditingPlan(plan);
                            setShowCreatePlan(false);
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Carriers Grid ────────────────────────────────────────────────────────

export function CarriersGrid({
  carriers,
}: {
  carriers: CarrierRecord[];
}) {
  if (carriers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Buildings className="size-8 text-muted-foreground/40" weight="thin" />
        <p className="text-sm font-medium">Nenhuma operadora cadastrada</p>
        <p className="text-xs text-muted-foreground">
          Nenhuma operadora disponível no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {carriers.map((carrier) => (
        <CarrierSheet key={carrier.id} carrier={carrier} />
      ))}
    </div>
  );
}
