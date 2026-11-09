"use client";

import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/shared/i18n";
import {
  SPECIALIZATION_OPTIONS,
  SPECIALTY_OTHER_SENTINEL,
} from "../constants/specializations";
import { useWorkshopOptions } from "../hooks/use-workshop-options";
import {
  isCustomSpecialty,
  specialtyFromSelectValue,
  specialtySelectValue,
  workshopFromSelectValue,
  workshopSelectValue,
  WORKSHOP_NONE_SENTINEL,
} from "../utils/technician-form";
import type { Technician } from "../types";

/** Workshop picker — a read-only reference while the workshop is locked,
 *  otherwise an optional select with a leading "بدون ورشة" empty option
 *  (free technicians register without a workshop). */
export function WorkshopField({
  technician,
  lockedWorkshopId,
  lockedWorkshopLabel,
  value,
  error,
  onChange,
}: {
  technician: Technician | null;
  lockedWorkshopId?: string;
  lockedWorkshopLabel?: string;
  value: string;
  error?: string;
  onChange: (workshopId: string) => void;
}) {
  const t = useT();
  const workshopLocked = Boolean(technician || lockedWorkshopId);
  const { data: workshops } = useWorkshopOptions(!workshopLocked);

  return (
    <FormField
      label={t("technicians.workshop")}
      error={error}
      className="sm:col-span-2"
      hint={workshopLocked ? t("technicians.workshopImmutable") : t("wizard.optionalHint")}
    >
      {workshopLocked ? (
        <Input
          readOnly
          value={lockedWorkshopLabel ?? technician?.workshopCode ?? value}
          className="bg-muted"
        />
      ) : (
        <Select
          value={workshopSelectValue(value)}
          onValueChange={(value) => onChange(workshopFromSelectValue(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("technicians.pickWorkshop")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={WORKSHOP_NONE_SENTINEL}>
              {t("technicians.noWorkshop")}
            </SelectItem>
            {(workshops ?? []).map((workshop) => (
              <SelectItem key={workshop.id} value={workshop.id}>
                {workshop.code} — {workshop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}

/** Specialty select with the "Other" sentinel that reveals a free-text input. */
export function SpecialtyField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (specialty: string) => void;
}) {
  const t = useT();

  return (
    <FormField label={t("technicians.specialty")} hint={t("wizard.optionalHint")}>
      <div className="flex flex-col gap-2">
        <Select
          value={specialtySelectValue(value)}
          onValueChange={(value) => onChange(specialtyFromSelectValue(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("technicians.specialtySelect")} />
          </SelectTrigger>
          <SelectContent>
            {SPECIALIZATION_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
            <SelectItem value={SPECIALTY_OTHER_SENTINEL}>
              {t("technicians.specialtyOther")}
            </SelectItem>
          </SelectContent>
        </Select>
        {isCustomSpecialty(value) ? (
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t("technicians.specialtyCustom")}
            aria-label={t("technicians.specialtyCustom")}
          />
        ) : null}
      </div>
    </FormField>
  );
}

/** Inline status editor — shown for existing technicians the user may edit. */
export function TechnicianStatusField({
  technician,
  onStatusChange,
}: {
  technician: Technician;
  onStatusChange: (value: string) => void;
}) {
  const t = useT();

  return (
    <FormField label={t("technicians.status")} className="sm:col-span-2">
      <Select value={technician.status} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Active">{t("technicians.statusActive")}</SelectItem>
          <SelectItem value="Inactive">{t("technicians.statusInactive")}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  );
}
