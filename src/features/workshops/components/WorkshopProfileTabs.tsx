"use client";

import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { Workshop } from "../types";
import { StatusTimeline } from "./StatusTimeline";
import { StatusActions } from "./StatusActions";
import { AssignmentsCard } from "./AssignmentsCard";
import { SurveySummaryCard } from "./SurveySummaryCard";
import { LocationCard } from "./LocationCard";
import { WorkshopTechniciansCard } from "./WorkshopTechniciansCard";
import { BasicInfoCard } from "./BasicInfoCard";
import { governorateLabel, workshopDisplayName } from "../utils/format";

const PROFILE_TABS = ["overview", "location", "technicians", "survey", "team"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

/** Tab value → dictionary label key, in display order. */
const PROFILE_TAB_ITEMS = [
  ["overview", "profile.tabOverview"],
  ["location", "profile.tabLocation"],
  ["technicians", "profile.tabTechnicians"],
  ["survey", "profile.tabSurvey"],
  ["team", "profile.tabTeam"],
] as const;

export function isProfileTab(value: string | null): value is ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab);
}

type WorkshopProfileTabsProps = {
  workshop: Workshop;
  activeTab: ProfileTab;
  /** Persists the tab to the URL (?tab=...); "overview" clears the param. */
  onTabChange: (tab: string) => void;
  canEdit: boolean;
  canAssign: boolean;
  canStartSurvey: boolean;
};

/** The workshop profile's tabbed detail area (all five tab bodies). */
export function WorkshopProfileTabs({
  workshop,
  activeTab,
  onTabChange,
  canEdit,
  canAssign,
  canStartSurvey,
}: WorkshopProfileTabsProps) {
  const t = useT();
  const { locale } = useI18n();
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Keep the active tab in view when the list overflows (narrow viewports).
  useEffect(() => {
    const list = tabsListRef.current;
    const active = list?.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
    if (!list || !active) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    if (tabRect.left < listRect.left || tabRect.right > listRect.right) {
      active.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="mt-4 flex flex-col gap-4"
    >
      <TabsList
        ref={tabsListRef}
        // Keep list dir LTR and reverse the row in Arabic so the first tab
        // (Overview) sits on the right without Radix/flex double-flipping.
        dir="ltr"
        className={cn(
          "flex h-auto w-full justify-stretch gap-0 overflow-x-auto overflow-y-hidden rounded-none",
          "border-b border-border bg-transparent p-0",
          locale === "ar" ? "flex-row-reverse" : "flex-row"
        )}
        aria-label={t("profile.tabsLabel")}
      >
        {PROFILE_TAB_ITEMS.map(([value, labelKey]) => (
          <TabsTrigger
            key={value}
            value={value}
            className={cn(
              "relative min-w-0 flex-1 basis-0 rounded-none border-0 bg-transparent px-2 py-2.5 shadow-none sm:px-3",
              "justify-center text-center text-[0.8125rem] font-semibold tracking-normal",
              "text-muted-foreground transition-colors hover:text-foreground",
              // Inset underline — avoids -mb overlap that spawned a vertical scrollbar.
              "data-[state=active]:bg-transparent data-[state=active]:font-bold",
              "data-[state=active]:text-[var(--navy)]",
              "data-[state=active]:shadow-[inset_0_-2px_0_0_var(--brand-blue)]",
              "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            )}
          >
            <span className="truncate">{t(labelKey)}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value="overview"
        className="mt-0 flex w-full flex-col gap-4 text-start outline-none"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BasicInfoCard workshop={workshop} />

          <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 text-start sm:p-5">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {t("profile.timeline")}
              </h2>
              <StatusTimeline status={workshop.status} />
            </div>
            {canEdit ? (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  {t("profile.statusAdvance")}
                </h2>
                <StatusActions workshop={workshop} />
              </div>
            ) : null}
          </section>
        </div>
      </TabsContent>

      <TabsContent
        value="location"
        className="mt-0 flex w-full flex-col gap-4 text-start outline-none"
      >
        <section className="rounded-lg border bg-card p-4 text-start">
          <h2 className="text-sm font-semibold text-[var(--navy)]">{t("profile.location")}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm md:grid-cols-[auto_1fr_auto_1fr]">
            <dt className="text-muted-foreground">{t("wizard.governorate")}</dt>
            <dd>{governorateLabel(workshop.governorate, locale)}</dd>
            {workshop.district ? (
              <>
                <dt className="text-muted-foreground">{t("profile.district")}</dt>
                <dd>{workshop.district}</dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">{t("profile.address")}</dt>
            <dd className="md:col-span-3">{workshop.address}</dd>
          </dl>
        </section>
        <LocationCard
          workshopId={workshop.id}
          latitude={workshop.latitude}
          longitude={workshop.longitude}
          label={workshopDisplayName(workshop)}
          canEdit={canEdit}
        />
      </TabsContent>

      <TabsContent value="technicians" className="mt-0 w-full text-start outline-none">
        <WorkshopTechniciansCard
          workshopId={workshop.id}
          workshopCode={workshop.code}
          workshopName={workshopDisplayName(workshop)}
        />
      </TabsContent>

      <TabsContent value="survey" className="mt-0 w-full text-start outline-none">
        <SurveySummaryCard workshopId={workshop.id} canStartSurvey={canStartSurvey} />
      </TabsContent>

      <TabsContent value="team" className="mt-0 w-full text-start outline-none">
        {canAssign ? (
          <AssignmentsCard workshopId={workshop.id} canAssign={canAssign} />
        ) : (
          <section className="rounded-lg border bg-card p-6 text-start">
            <p className="text-sm text-muted-foreground">{t("profile.tabTeamRestricted")}</p>
          </section>
        )}
      </TabsContent>
    </Tabs>
  );
}
