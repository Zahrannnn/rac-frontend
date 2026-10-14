"use client";

import { Play, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useT } from "@/shared/i18n";
import type { RubricKind } from "../types";

/** One recommendation card's empty body: what the missing kind would do + the create CTA. */
export function EmptyRunCard({
  kind,
  canRun,
  canCreate,
  onViewCreate,
}: {
  kind: RubricKind;
  canRun: boolean;
  canCreate: boolean;
  onViewCreate: (kind: RubricKind) => void;
}) {
  const t = useT();
  const titleKey =
    kind === "participation"
      ? "selection.current.participationTitle"
      : "selection.current.equipmentTitle";
  const messageKey =
    kind === "participation"
      ? "selection.current.participationEmpty"
      : "selection.current.equipmentEmpty";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <CardTitle>{t(titleKey)}</CardTitle>
      <p className="text-sm leading-6 text-muted-foreground">{t(messageKey)}</p>

      {canRun ? (
        <>
          <div className="mt-auto pt-1">
            {kind === "participation" ? (
              <Button type="button" onClick={() => onViewCreate(kind)}>
                <Play data-icon="inline-start" />
                {t("selection.runs.createParticipation")}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canCreate}
                onClick={() => onViewCreate(kind)}
              >
                <Wrench data-icon="inline-start" />
                {t("selection.runs.createEquipment")}
              </Button>
            )}
          </div>
          {!canCreate && kind === "equipment" ? (
            <p className="text-xs text-muted-foreground">
              {t("selection.runs.equipmentNeedsParticipationHint")}
            </p>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
