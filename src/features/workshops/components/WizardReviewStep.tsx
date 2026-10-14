"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import { useI18n, useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";
import { governorateLabel } from "../utils/format";
import type { WorkshopWizardController } from "../hooks/use-workshop-wizard";

/** Step 4 — review with jump-to-step edit links, plus the final notes field. */
export function WizardReviewStep({ wizard }: { wizard: WorkshopWizardController }) {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const { state } = wizard;

  return (
    <div className="flex flex-col gap-4">
      <ReviewGroup
        title={t("wizard.reviewIdentification")}
        onEdit={() => wizard.goToStep(0)}
        editLabel={t("wizard.editStep")}
      >
        <ReviewRow label={t("workshops.colCode")} value={t("wizard.codePreview")} />
        <ReviewRow label={t("wizard.createdBy")} value={user?.fullName ?? "—"} />
      </ReviewGroup>
      <ReviewGroup
        title={t("wizard.reviewBasic")}
        onEdit={() => wizard.goToStep(1)}
        editLabel={t("wizard.editStep")}
      >
        <ReviewRow label={t("wizard.nameEn")} value={state.basic.nameEn} />
        {state.basic.nameAr ? (
          <ReviewRow label={t("wizard.nameAr")} value={state.basic.nameAr} />
        ) : null}
        <ReviewRow label={t("wizard.ownerName")} value={state.basic.ownerName} />
        <ReviewRow label={t("wizard.mobile")} value={state.basic.mobile} />
        {state.basic.telephone ? (
          <ReviewRow label={t("wizard.telephone")} value={state.basic.telephone} />
        ) : null}
        <ReviewRow label={t("wizard.type")} value={t(`type.${state.basic.type}` as const)} />
        {state.basic.numberOfTechnicians !== null ? (
          <ReviewRow
            label={t("wizard.numberOfTechnicians")}
            value={String(state.basic.numberOfTechnicians)}
          />
        ) : null}
      </ReviewGroup>
      <ReviewGroup
        title={t("wizard.reviewLocation")}
        onEdit={() => wizard.goToStep(2)}
        editLabel={t("wizard.editStep")}
      >
        <ReviewRow
          label={t("wizard.governorate")}
          value={governorateLabel(state.location.governorate, locale)}
        />
        {state.location.district ? (
          <ReviewRow label={t("wizard.district")} value={state.location.district} />
        ) : null}
        <ReviewRow label={t("wizard.address")} value={state.location.address} />
        {state.location.latitude !== null && state.location.longitude !== null ? (
          <ReviewRow
            label={t("profile.coordinates")}
            value={`${state.location.latitude}, ${state.location.longitude}`}
          />
        ) : (
          <ReviewRow label={t("profile.coordinates")} value={t("profile.noCoordinates")} />
        )}
      </ReviewGroup>
      <FormField label={t("profile.notes")} hint={t("wizard.optionalHint")}>
        <Input
          value={state.notes}
          onChange={(event) => wizard.setNotes(event.target.value)}
        />
      </FormField>
    </div>
  );
}

function ReviewGroup({
  title,
  children,
  onEdit,
  editLabel,
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <div className="rounded-md border p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</h3>
        {onEdit && editLabel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-1.5">
            <Pencil className="h-3.5 w-3.5 text-[var(--secondary)]" />
            {editLabel}
          </Button>
        ) : null}
      </div>
      <dl className="mt-2 flex flex-col gap-1.5 text-sm">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium text-[var(--navy)]">{value}</dd>
    </div>
  );
}
