"use client";

import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { SelectionRunsCard } from "./SelectionRunsCard";

/**
 * Screen 05 — machine-scored selection (ADR-0004). The page composes the runs
 * history: every run is an immutable snapshot of one rubric kind, and each run
 * detail is the rankings view. There is no global ranking table — the ranked
 * pool lives inside each run snapshot.
 */
export function SelectionPage() {
  const t = useT();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("selection.title")} description={t("selection.subtitle")} />

      <SelectionRunsCard />
    </div>
  );
}
