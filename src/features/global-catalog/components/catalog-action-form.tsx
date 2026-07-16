"use client";

import type { FormEvent, ReactNode } from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CatalogActionState } from "../types";

type CatalogAction = (formData: FormData) => Promise<CatalogActionState>;

export function CatalogActionForm({
  action,
  children,
  submitLabel,
  submittingLabel = "Salvando...",
  className,
  submitVariant = "default",
}: {
  action: CatalogAction;
  children: ReactNode;
  submitLabel: string;
  submittingLabel?: string;
  className?: string;
  submitVariant?: "default" | "outline";
}) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.success) {
        form.reset();
        toast.success(result.success);
      }
    });
  }

  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
      <Button disabled={isPending} type="submit" variant={submitVariant}>
        {isPending ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
