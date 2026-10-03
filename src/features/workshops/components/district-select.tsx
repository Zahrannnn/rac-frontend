"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, useT } from "@/shared/i18n";
import {
  districtLabel,
  districtsFor,
  isListedDistrict,
  OTHER_DISTRICT,
} from "@/shared/constants/districts";

/**
 * Initial Other-district state for a form opening with a stored value: legacy
 * free-text districts (not in the curated list for the workshop's governorate)
 * pre-select Other with the stored text preserved — existing data is never lost.
 */
export function initDistrictChoice(
  governorate: string,
  storedDistrict: string | null | undefined
): { other: boolean; manual: string } {
  const district = (storedDistrict ?? "").trim();
  if (!district || isListedDistrict(governorate, district)) {
    return { other: false, manual: "" };
  }
  return { other: true, manual: district };
}

/**
 * Searchable, governorate-dependent district picker: a plain Select with a
 * filter Input inside the content (no new packages). Options come from the
 * curated map for the selected governorate, with "Other (not listed)" last.
 * Disabled until a governorate is chosen.
 */
export function DistrictSelect(props: {
  governorate: string;
  /** Listed district value, OTHER_DISTRICT while the escape hatch is active, or "" when nothing is picked. */
  value: string;
  onPick: (value: string) => void;
  disabled?: boolean;
}) {
  const { locale } = useI18n();
  const t = useT();
  const [query, setQuery] = useState("");

  const listed = districtsFor(props.governorate);
  const needle = query.trim();
  const filtered = needle
    ? listed.filter(
        (district) =>
          district.toLowerCase().includes(needle.toLowerCase()) ||
          districtLabel(props.governorate, district, locale).includes(needle)
      )
    : listed;

  return (
    <Select
      value={props.value || undefined}
      onValueChange={(value) => {
        props.onPick(value);
        setQuery("");
      }}
      disabled={props.disabled || !props.governorate}
    >
      <SelectTrigger>
        <SelectValue placeholder={t("wizard.districtPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {/* The filter input lives inside the dropdown; stop propagation so the
            Select's typeahead doesn't swallow keystrokes or close the content. */}
        <div
          className="sticky top-0 z-10 bg-popover p-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("wizard.districtSearch")}
          />
        </div>
        {filtered.map((district) => (
          <SelectItem key={district} value={district}>
            {districtLabel(props.governorate, district, locale)}
          </SelectItem>
        ))}
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {t("wizard.districtNoMatch")}
          </p>
        ) : null}
        <SelectItem value={OTHER_DISTRICT}>{t("wizard.districtOther")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
