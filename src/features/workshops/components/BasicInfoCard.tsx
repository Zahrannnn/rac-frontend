"use client";

import { useI18n, useT } from "@/shared/i18n";
import { governorateLabel } from "../utils/format";
import type { Workshop } from "../types";

/** Read-only basic-info details on the profile overview tab. */
export function BasicInfoCard({ workshop }: { workshop: Workshop }) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <h2 className="text-sm font-semibold text-[var(--navy)]">{t("profile.basicInfo")}</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("profile.owner")}</dt>
        <dd>{workshop.ownerName}</dd>
        <dt className="text-muted-foreground">{t("profile.contactMobile")}</dt>
        <dd className="tabular-nums" dir="ltr">
          {workshop.mobile}
        </dd>
        {workshop.telephone ? (
          <>
            <dt className="text-muted-foreground">{t("profile.telephone")}</dt>
            <dd className="tabular-nums" dir="ltr">
              {workshop.telephone}
            </dd>
          </>
        ) : null}
        {workshop.activities ? (
          <>
            <dt className="text-muted-foreground">{t("profile.activities")}</dt>
            <dd>{workshop.activities}</dd>
          </>
        ) : null}
        {workshop.numberOfTechnicians !== null ? (
          <>
            <dt className="text-muted-foreground">{t("profile.techniciansCount")}</dt>
            <dd className="tabular-nums">{workshop.numberOfTechnicians}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">{t("wizard.governorate")}</dt>
        <dd>{governorateLabel(workshop.governorate, locale)}</dd>
        <dt className="text-muted-foreground">{t("profile.address")}</dt>
        <dd>{workshop.address}</dd>
      </dl>
      {workshop.notes ? (
        <p className="mt-3 border-t pt-2 text-sm text-muted-foreground">
          {t("profile.notes")}: {workshop.notes}
        </p>
      ) : null}
    </section>
  );
}
