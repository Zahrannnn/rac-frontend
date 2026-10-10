"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT, type TranslationKey } from "@/shared/i18n";
import { useUpdateWorkshop } from "../hooks/use-workshops";
import { LIFECYCLE_TRANSITIONS, type Workshop, type WorkshopStatus } from "../types";

/**
 * Transition buttons for the current state, per the server's lifecycle map.
 * The backend re-runs duplicate detection on every PATCH and answers 409 with
 * the match list unless ConfirmDuplicate is set — so a 409 here raises a
 * confirm dialog and retries with the flag (the SRS "never block" rule).
 */
export function StatusActions({ workshop }: { workshop: Workshop }) {
  const t = useT();
  const update = useUpdateWorkshop(workshop.id);
  const [pending, setPending] = useState<WorkshopStatus | null>(null);
  const [duplicateRetry, setDuplicateRetry] = useState<WorkshopStatus | null>(null);

  const targets = LIFECYCLE_TRANSITIONS[workshop.status];

  if (targets.length === 0) {
    // Complete is terminal (ADR-0004) — the workshop is selection-eligible; scoring
    // is machine-derived from its survey when the next run fires.
    return (
      <p className="text-sm text-muted-foreground">
        {workshop.status === "Complete"
          ? t("profile.awaitingScoring")
          : t("profile.terminalState")}
      </p>
    );
  }

  function confirmTransition(target: WorkshopStatus, confirmDuplicate = false) {
    update.mutate(
      { status: target, confirmDuplicate },
      {
        onSuccess: () => {
          toast.success(t("profile.transitionDone"));
          setDuplicateRetry(null);
        },
        onError: (error) => {
          const status = (error as { status?: number }).status;

          if (status === 409 && !confirmDuplicate) {
            setDuplicateRetry(target);
          } else if (status === 409) {
            setDuplicateRetry(null);
            toast.error(t("profile.transitionConflict"));
          } else if (status !== 403) {
            toast.error(`${t("common.error")} — ${t("common.retry")}`);
          }
        },
      }
    );
    setPending(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <Button
          key={target}
          type="button"
          variant="outline"
          size="sm"
          disabled={update.isPending}
          onClick={() => setPending(target)}
        >
          {t(`profile.transition.${workshop.status}>${target}` as TranslationKey)}
        </Button>
      ))}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogTitle>
            {t("profile.transitionConfirm", {
              status: pending ? t(`status.${pending}` as TranslationKey) : "",
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("profile.transitionConfirm", {
              status: pending ? t(`status.${pending}` as TranslationKey) : "",
            })}
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPending(null)}>
              {t("profile.cancel")}
            </Button>
            <Button type="button" onClick={() => pending && confirmTransition(pending)}>
              {t("profile.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={duplicateRetry !== null}
        onOpenChange={(open) => !open && setDuplicateRetry(null)}
      >
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogTitle>{t("duplicate.conflictRetry")}</DialogTitle>
          <DialogDescription className="sr-only">{t("duplicate.conflictRetry")}</DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDuplicateRetry(null)}>
              {t("profile.cancel")}
            </Button>
            <Button
              type="button"
              disabled={update.isPending}
              onClick={() => duplicateRetry && confirmTransition(duplicateRetry, true)}
            >
              {t("duplicate.continueNew")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
