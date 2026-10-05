"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Check, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import { FormField } from "@/shared/components/form/form-field";
import { LocationMapLazy } from "@/shared/components/map";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { GOVERNORATES } from "@/shared/constants/egypt";
import { OTHER_DISTRICT } from "@/shared/constants/districts";
import { DistrictSelect } from "./district-select";
import { useI18n, useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";
import { WORKSHOP_TYPES, WIZARD_STEP_DESCRIPTIONS, WIZARD_STEP_KEYS } from "../constants/wizard-steps";
import { useWorkshopWizard } from "../hooks/use-workshop-wizard";
import { districtReset } from "../utils/workshop-wizard";
import { governorateLabel } from "../utils/format";
import { DuplicatePanel } from "./DuplicatePanel";
import { WizardStepper } from "./WizardStepper";

/**
 * Workshop registration wizard — a thin render shell over useWorkshopWizard.
 * Step bodies stay inline: they all draw on the same wizard state and patches,
 * so splitting them would only trade colocated JSX for prop drilling.
 */
export function RegisterWorkshopPage() {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const wizard = useWorkshopWizard();
  const geolocation = useGeolocationCapture();
  const gpsState = geolocation.status;

  const { step, state, fieldErrors } = wizard;
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  function captureGps() {
    geolocation.capture({
      onPosition: (latitude, longitude) => wizard.patchLocation({ latitude, longitude }),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageBreadcrumbs
        items={[
          { label: t("workshops.title"), href: "/workshops" },
          { label: t("workshops.register") },
        ]}
      />
      <PageHeader title={t("wizard.title")} description={t("wizard.subtitle")}>
        <Button asChild variant="outline">
          <Link href="/workshops">
            <ArrowLeft data-icon="inline-start" className="rtl:rotate-180" />
            {t("wizard.backToList")}
          </Link>
        </Button>
      </PageHeader>

      <WizardStepper step={step} onStepChange={wizard.goToStep} />

      {wizard.duplicates.length > 0 ? (
        <DuplicatePanel
          matches={wizard.duplicates}
          busy={wizard.submitPending}
          onContinueAsNew={wizard.continueAsNew}
          onDismiss={wizard.dismissDuplicates}
        />
      ) : wizard.probeReady && wizard.duplicateCheckPending ? (
        <p className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          {t("wizard.checkingDuplicates")}
        </p>
      ) : null}

      <section className="rounded-lg border bg-card p-5 sm:p-6">
        <header className="mb-5 border-b border-border pb-4">
          <h2
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold text-[var(--navy)] outline-none"
          >
            {t(WIZARD_STEP_KEYS[step])}
          </h2>
          <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">
            {t(WIZARD_STEP_DESCRIPTIONS[step])}
          </p>
        </header>

        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-dashed border-primary/30 bg-[color-mix(in_oklab,var(--brand-blue)_8%,white)] p-4">
              <p className="text-xs font-semibold uppercase text-primary">{t("workshops.colCode")}</p>
              <p className="mt-2 text-sm text-[var(--navy)]">{t("wizard.codePreview")}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("wizard.createdBy")}
              </p>
              <p className="mt-2 text-sm font-medium">{user?.fullName ?? "—"}</p>
            </div>
            <ul className="sm:col-span-2 space-y-2 rounded-md border bg-card p-4 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {t("wizard.introNeedBasic")}
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary)]" aria-hidden />
                {t("wizard.introNeedLocation")}
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {t("wizard.introNeedReview")}
              </li>
            </ul>
            <p className="text-sm text-muted-foreground sm:col-span-2">{t("wizard.requiredHint")}</p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("wizard.nameEn")} required error={fieldErrors.nameEn}>
              <Input
                value={state.basic.nameEn}
                onChange={(event) => wizard.patchBasic({ nameEn: event.target.value })}
                aria-invalid={Boolean(fieldErrors.nameEn)}
                onBlur={wizard.collectCurrentStepErrors}
                autoComplete="organization"
              />
            </FormField>
            <FormField label={t("wizard.nameAr")} hint={t("wizard.optionalHint")}>
              <Input
                value={state.basic.nameAr ?? ""}
                onChange={(event) => wizard.patchBasic({ nameAr: event.target.value })}
              />
            </FormField>
            <FormField label={t("wizard.ownerName")} required error={fieldErrors.ownerName}>
              <Input
                value={state.basic.ownerName}
                onChange={(event) => wizard.patchBasic({ ownerName: event.target.value })}
                aria-invalid={Boolean(fieldErrors.ownerName)}
                onBlur={wizard.collectCurrentStepErrors}
                autoComplete="name"
              />
            </FormField>
            <FormField
              label={t("wizard.mobile")}
              required
              error={fieldErrors.mobile}
              hint={t("wizard.mobileHint")}
            >
              <Input
                value={state.basic.mobile}
                onChange={(event) => wizard.patchBasic({ mobile: event.target.value })}
                aria-invalid={Boolean(fieldErrors.mobile)}
                inputMode="tel"
                dir="ltr"
                className="tabular-nums"
                onBlur={wizard.collectCurrentStepErrors}
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
              />
            </FormField>
            <FormField label={t("wizard.type")}>
              <Select
                value={state.basic.type}
                onValueChange={(value) => wizard.setWorkshopType(value as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSHOP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`type.${type}` as const)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={t("wizard.numberOfTechnicians")}
              error={fieldErrors.numberOfTechnicians}
              hint={t("wizard.optionalHint")}
            >
              <Input
                type="number"
                min={0}
                max={1000}
                value={state.basic.numberOfTechnicians ?? ""}
                onChange={(event) =>
                  wizard.patchBasic({
                    numberOfTechnicians:
                      event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
            </FormField>
            <FormField label={t("wizard.telephone")} hint={t("wizard.optionalHint")}>
              <Input
                value={state.basic.telephone ?? ""}
                onChange={(event) => wizard.patchBasic({ telephone: event.target.value })}
                inputMode="tel"
                dir="ltr"
              />
            </FormField>
            <FormField label={t("wizard.activities")} hint={t("wizard.optionalHint")}>
              <Input
                value={state.basic.activities ?? ""}
                onChange={(event) => wizard.patchBasic({ activities: event.target.value })}
              />
            </FormField>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("wizard.governorate")} required error={fieldErrors.governorate}>
              <Select
                value={state.location.governorate}
                onValueChange={(value) =>
                  wizard.patchLocation({ governorate: value, ...districtReset() })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNORATES.map((governorate) => (
                    <SelectItem key={governorate} value={governorate}>
                      {governorateLabel(governorate, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={t("wizard.district")}
              hint={t("wizard.optionalHint")}
              error={fieldErrors.district}
            >
              <DistrictSelect
                governorate={state.location.governorate}
                value={state.location.districtOther ? OTHER_DISTRICT : state.location.district ?? ""}
                onPick={(value) =>
                  value === OTHER_DISTRICT
                    ? wizard.patchLocation({ district: "", districtOther: true })
                    : wizard.patchLocation({ district: value, districtOther: false })
                }
              />
              {state.location.districtOther ? (
                <Input
                  className="mt-2"
                  value={state.location.district}
                  onChange={(event) =>
                    wizard.patchLocation({ district: event.target.value, districtOther: true })
                  }
                  placeholder={t("wizard.districtManualPlaceholder")}
                  aria-invalid={Boolean(fieldErrors.district)}
                />
              ) : null}
            </FormField>
            <FormField
              label={t("wizard.address")}
              required
              error={fieldErrors.address}
              className="sm:col-span-2"
            >
              <Input
                value={state.location.address}
                onChange={(event) => wizard.patchLocation({ address: event.target.value })}
                aria-invalid={Boolean(fieldErrors.address)}
                onBlur={wizard.collectCurrentStepErrors}
              />
            </FormField>
            <div className="sm:col-span-2 rounded-md border bg-[color-mix(in_oklab,var(--brand-blue)_5%,white)] p-4">
              <p className="text-sm font-semibold text-[var(--navy)]">{t("wizard.gps")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("wizard.gpsHint")}</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <FormField label={t("wizard.lat")}>
                  <Input
                    className="w-36 tabular-nums"
                    value={state.location.latitude ?? ""}
                    onChange={(event) =>
                      wizard.patchLocation({
                        latitude: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                    inputMode="decimal"
                    dir="ltr"
                  />
                </FormField>
                <FormField label={t("wizard.lon")}>
                  <Input
                    className="w-36 tabular-nums"
                    value={state.location.longitude ?? ""}
                    onChange={(event) =>
                      wizard.patchLocation({
                        longitude: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                    inputMode="decimal"
                    dir="ltr"
                  />
                </FormField>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={captureGps}
                  disabled={gpsState === "capturing"}
                >
                  <MapPin data-icon="inline-start" />
                  {gpsState === "capturing" ? t("wizard.capturingGps") : t("wizard.captureGps")}
                </Button>
                {gpsState === "captured" && state.location.latitude !== null ? (
                  <span className="text-sm font-medium text-[var(--success)]">
                    {t("wizard.gpsCaptured")}
                  </span>
                ) : null}
              </div>
              {fieldErrors.latitude ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {fieldErrors.latitude}
                </p>
              ) : null}
              {state.location.latitude !== null && state.location.longitude !== null ? (
                <div className="mt-3">
                  <LocationMapLazy
                    lat={state.location.latitude}
                    lon={state.location.longitude}
                    editable
                    onChange={(newLat, newLon) =>
                      wizard.patchLocation({ latitude: newLat, longitude: newLon })
                    }
                    height={260}
                  />
                </div>
              ) : (
                <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  {t("map.noCoordinatesHint")}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
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
        ) : null}

        <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex items-center justify-between gap-3 border-t bg-card px-5 py-4 sm:-mx-6 sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || wizard.submitPending}
            onClick={() => wizard.goToStep(Math.max(0, step - 1))}
          >
            {t("wizard.back")}
          </Button>
          {step < WIZARD_STEP_KEYS.length - 1 ? (
            <Button type="button" onClick={wizard.handleNext}>
              {step === 0 ? t("wizard.begin") : t("wizard.next")}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={
                wizard.submitPending ||
                (wizard.duplicates.length > 0 && !wizard.isDuplicateConfirmed)
              }
              onClick={() => wizard.submit(wizard.isDuplicateConfirmed)}
            >
              {wizard.submitPending ? t("wizard.submitting") : t("wizard.submit")}
            </Button>
          )}
        </div>
      </section>
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
