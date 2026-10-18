"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { routes } from "@/shared/constants/routes";
import { useT } from "@/shared/i18n";
import { useDeleteWorkshop } from "../hooks/use-workshops";
import type { Workshop } from "../types";

/**
 * Danger zone — Draft-only deletion (product decision 2026-10). Rendered at the bottom of
 * the workshop profile; hidden unless the viewer holds workshops:delete AND the workshop
 * is still Draft — the backend 409s anything that entered the lifecycle anyway.
 * The confirm dialog stays disabled until the workshop code is typed exactly.
 */
export function WorkshopDeleteCard({
  workshop,
  canDelete,
}: {
  workshop: Workshop;
  canDelete: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const deletion = useDeleteWorkshop();
  const [open, setOpen] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const codeMatches = typedCode.trim() === workshop.code;

  if (!canDelete || workshop.status !== "Draft") {
    return null;
  }

  function confirmDelete() {
    deletion.mutate(workshop.id, {
      onSuccess: () => {
        toast.success(t("profile.deleteDone"));
        router.push(routes.workshops);
      },
      onError: () => {
        toast.error(t("profile.deleteConflict"));
        setOpen(false);
      },
    });
  }

  return (
    <section
      aria-labelledby="workshop-danger-zone"
      className="rounded-lg border border-destructive/40 bg-card p-4"
    >
      <h2 id="workshop-danger-zone" className="text-sm font-semibold text-destructive">
        {t("profile.dangerZone")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("profile.deleteDescription")}</p>
      <Button
        type="button"
        variant="destructive"
        className="mt-3"
        onClick={() => {
          setTypedCode("");
          setOpen(true);
        }}
      >
        <Trash2 data-icon="inline-start" />
        {t("profile.deleteButton")}
      </Button>

      <ConfirmDialog
        open={open}
        title={t("profile.deleteTitle")}
        description={t("profile.deleteDialogText")}
        confirmLabel={t("profile.deleteButton")}
        isPending={deletion.isPending}
        confirmDisabled={!codeMatches}
        onConfirm={confirmDelete}
        onClose={() => setOpen(false)}
      >
        <label className="mt-3 flex flex-col gap-1.5 text-sm">
          <span>{t("profile.deleteTypeCode", { code: workshop.code })}</span>
          <Input
            value={typedCode}
            onChange={(event) => setTypedCode(event.target.value)}
            autoComplete="off"
            dir="ltr"
          />
        </label>
      </ConfirmDialog>
    </section>
  );
}
