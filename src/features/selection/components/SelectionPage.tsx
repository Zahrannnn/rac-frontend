"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { CurrentRunsCards } from "./CurrentRunsCards";
import { RunCreateConfirm } from "./RunCreateConfirm";
import { SelectionRunsCard } from "./SelectionRunsCard";
import type { RubricKind } from "../types";

/**
 * Screen 05 — machine-scored selection (ADR-0004). The page composes the two
 * current-recommendation cards, the compact run history, and owns the shared
 * kind-aware create-confirm dialog so every create entry point (card CTA, compact
 * new-run action, empty-state CTA) funnels through one confirmation. Every run is
 * an immutable snapshot; the ranked pool of each run lives on its own route.
 */
export function SelectionPage() {
  const t = useT();
  const [confirmKind, setConfirmKind] = useState<RubricKind | null>(null);
  const requestCreate = useCallback((kind: RubricKind) => setConfirmKind(kind), []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("selection.title")} description={t("selection.subtitle")} />

      <CurrentRunsCards onRequestCreate={requestCreate} />
      <SelectionRunsCard />

      <RunCreateConfirm
        kind={confirmKind ?? "participation"}
        open={confirmKind !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
      />
    </div>
  );
}
