"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import { useT } from "@/shared/i18n";
import { isEgyptianMobile } from "@/shared/validation/mobile";
import { isProbeComplete } from "../utils/duplicate-actions";
import {
  buildCreatePayload,
  collectStepErrors,
  initialWizardState,
  isWizardStepValid,
  type WizardState,
} from "../utils/workshop-wizard";
import { WIZARD_STEP_KEYS } from "../constants/wizard-steps";
import { useCreateWorkshop, useDuplicateCheck } from "./use-workshops";
import type { DuplicateProbe } from "../api/workshops-adapter";
import type { DuplicateCheckResponse, DuplicateMatch, WorkshopType } from "../types";

const LAST_STEP = WIZARD_STEP_KEYS.length - 1;
const DUPLICATE_DEBOUNCE_MS = 500;

/**
 * The registration wizard's state machine: four steps, per-step zod validation,
 * live (debounced) duplicate probing with the SRS confirm/dismiss flow, and the
 * create submission. The page component renders what this hook decides.
 */
export function useWorkshopWizard() {
  const router = useRouter();
  const t = useT();
  const duplicateCheck = useDuplicateCheck();
  const createWorkshop = useCreateWorkshop();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const dismissedProbe = useRef<string>("");

  const probe: DuplicateProbe = useMemo(
    () => ({
      nameEn: state.basic.nameEn.trim(),
      ownerName: state.basic.ownerName.trim(),
      mobile: state.basic.mobile.trim(),
      address: state.location.address.trim(),
      governorate: state.location.governorate,
      latitude: state.location.latitude,
      longitude: state.location.longitude,
    }),
    [state]
  );
  const probeKey = JSON.stringify(probe);
  const probeReady = isProbeComplete(probe) && isEgyptianMobile(probe.mobile);

  // Live duplicate probe — debounced, advisory, re-armed when fields change.
  useEffect(() => {
    if (!probeReady || confirmedDuplicate || probeKey === dismissedProbe.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      duplicateCheck.mutate(probe, {
        onSuccess: (response) => setDuplicates(response.duplicates),
        onError: () => setDuplicates([]),
      });
    }, DUPLICATE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probeKey, probeReady, confirmedDuplicate]);

  function goToStep(next: number) {
    setFieldErrors({});
    setStep(next);
  }

  function patchBasic(patch: Partial<WizardState["basic"]>) {
    setState((prev) => ({ ...prev, basic: { ...prev.basic, ...patch } }));
    setConfirmedDuplicate(false);
    dismissedProbe.current = "";
  }

  function patchLocation(patch: Partial<WizardState["location"]>) {
    setState((prev) => ({ ...prev, location: { ...prev.location, ...patch } }));
    setConfirmedDuplicate(false);
    dismissedProbe.current = "";
  }

  /** Refresh the per-field Arabic errors for the current step (no state change if valid). */
  function collectCurrentStepErrors() {
    setFieldErrors(collectStepErrors(step, state, t));
  }

  function handleNext() {
    if (!isWizardStepValid(step, state)) {
      setFieldErrors(collectStepErrors(step, state, t));
      toast.warning(t("wizard.stepInvalid"));
      return;
    }
    goToStep(Math.min(step + 1, LAST_STEP));
  }

  function dismissDuplicates() {
    dismissedProbe.current = probeKey;
    setDuplicates([]);
  }

  function submit(confirmDuplicate: boolean) {
    const payload = buildCreatePayload(state, { ...probe, confirmDuplicate });

    createWorkshop.mutate(payload, {
      onSuccess: (response) => {
        toast.success(
          `${t("wizard.success")} — ${t("wizard.createdCode", { code: response.workshop.code })}`
        );
        router.push(`/workshops/${response.workshop.id}` as Route);
      },
      onError: (error) => {
        const duplicatesFromConflict = (error as { data?: DuplicateCheckResponse }).data
          ?.duplicates;

        if ((error as { status?: number }).status === 409) {
          setDuplicates(duplicatesFromConflict ?? []);
          toast.warning(t("duplicate.conflict"));
        } else {
          toast.error(`${t("common.error")} — ${t("common.retry")}`);
        }
      },
    });
  }

  function continueAsNew() {
    setConfirmedDuplicate(true);
    setDuplicates([]);
    submit(true);
  }

  return {
    // steps
    step,
    stepCount: WIZARD_STEP_KEYS.length,
    goToStep,
    handleNext,
    // form state
    state,
    fieldErrors,
    patchBasic,
    patchLocation,
    collectCurrentStepErrors,
    setNotes: (notes: string) => setState((prev) => ({ ...prev, notes })),
    // duplicates
    duplicates,
    duplicateCheckPending: duplicateCheck.isPending,
    probeReady,
    isDuplicateConfirmed: confirmedDuplicate,
    dismissDuplicates,
    continueAsNew,
    // submission
    submit,
    submitPending: createWorkshop.isPending,
    setWorkshopType: (type: WorkshopType) => patchBasic({ type }),
  };
}
