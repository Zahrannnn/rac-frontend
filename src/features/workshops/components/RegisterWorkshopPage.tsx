"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import { useT } from "@/shared/i18n";
import { WIZARD_STEP_DESCRIPTIONS, WIZARD_STEP_KEYS } from "../constants/wizard-steps";
import { useWorkshopWizard } from "../hooks/use-workshop-wizard";
import { DuplicatePanel } from "./DuplicatePanel";
import { WizardStepper } from "./WizardStepper";
import { WizardIntroStep } from "./WizardIntroStep";
import { WizardBasicInfoStep } from "./WizardBasicInfoStep";
import { WizardLocationStep } from "./WizardLocationStep";
import { WizardReviewStep } from "./WizardReviewStep";

/**
 * Workshop registration wizard — a thin shell over useWorkshopWizard. This
 * component owns the step chrome (heading focus, stepper, duplicate panel,
 * footer navigation) and mounts one step body component per wizard step; each
 * step draws on the same shared wizard controller.
 */
export function RegisterWorkshopPage() {
  const t = useT();
  const wizard = useWorkshopWizard();

  const { step } = wizard;
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

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

        {step === 0 ? <WizardIntroStep /> : null}

        {step === 1 ? <WizardBasicInfoStep wizard={wizard} /> : null}

        {step === 2 ? <WizardLocationStep wizard={wizard} /> : null}

        {step === 3 ? <WizardReviewStep wizard={wizard} /> : null}

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
