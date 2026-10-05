"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useI18n, useT } from "@/shared/i18n";
import { workshopEdit } from "@/shared/constants/routes";
import { cn } from "@/shared/utils/cn";
import { useAuth, can } from "@/features/auth";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useWorkshop } from "../hooks/use-workshops";
import { formatDateUtc, governorateLabel, workshopDisplayName } from "../utils/format";
import type { Workshop } from "../types";
import { FlagBadge, StatusBadge, TypeBadge } from "./badges";
import { StatusTimeline } from "./StatusTimeline";
import { StatusActions } from "./StatusActions";
import { AssignmentsCard } from "./AssignmentsCard";
import { SurveySummaryCard } from "./SurveySummaryCard";
import { LocationCard } from "./LocationCard";
import { WorkshopTechniciansCard } from "./WorkshopTechniciansCard";
import { BasicInfoCard } from "./BasicInfoCard";
import { WorkshopDetailSkeleton, WorkshopNotFoundState } from "./WorkshopLoadStates";

const PROFILE_TABS = ["overview", "location", "technicians", "survey", "team"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

/** Tab value → dictionary label key, in display order. */
const PROFILE_TAB_ITEMS = [
  ["overview", "profile.tabOverview"],
  ["location", "profile.tabLocation"],
  ["technicians", "profile.tabTechnicians"],
  ["survey", "profile.tabSurvey"],
  ["team", "profile.tabTeam"],
] as const;

function isProfileTab(value: string | null): value is ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab);
}

export function WorkshopProfilePage({ workshopId }: { workshopId: string }) {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const { data: workshop, isPending, isError } = useWorkshop(workshopId);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const tabParam = searchParams.get("tab");
  const activeTab: ProfileTab = isProfileTab(tabParam) ? tabParam : "overview";

  useEffect(() => {
    if (!codeCopied) {
      return;
    }
    const timeout = window.setTimeout(() => setCodeCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [codeCopied]);

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

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace((query ? `?${query}` : "?") as Parameters<typeof router.replace>[0], {
      scroll: false,
    });
  }

  if (isPending) {
    return <WorkshopDetailSkeleton />;
  }

  // 404 = missing OR existence-hiding (unassigned FieldTeam) — same graceful state.
  if (isError || !workshop) {
    return <WorkshopNotFoundState />;
  }

  const canEdit = mounted && Boolean(user && can(user.permissions, "workshops:edit"));
  const canAssign = mounted && Boolean(user && can(user.permissions, "workshops:assign"));
  const canStartSurvey = mounted && Boolean(user && can(user.permissions, "surveys:create"));

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(workshop!.code);
      setCodeCopied(true);
      toast.success(t("profile.codeCopied"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <>
      <PageHeader
        title={workshopDisplayName(workshop)}
        description={workshop.nameAr ? workshop.nameEn : undefined}
      >
        {canEdit ? (
          <Button variant="secondary" onClick={() => router.push(workshopEdit(workshop.id))}>
            <Pencil data-icon="inline-start" />
            {t("profile.edit")}
          </Button>
        ) : null}
      </PageHeader>

      <IdentityStrip workshop={workshop} codeCopied={codeCopied} onCopyCode={copyCode} />

      <Tabs
        value={activeTab}
        onValueChange={setTab}
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
    </>
  );
}

function IdentityStrip({
  workshop,
  codeCopied,
  onCopyCode,
}: {
  workshop: Workshop;
  codeCopied: boolean;
  onCopyCode: () => void;
}) {
  const t = useT();

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
      <span className="flex items-center gap-2 rounded-md bg-[var(--navy-shell)] px-2.5 py-1.5 font-mono text-sm text-white">
        {workshop.code}
        <button
          type="button"
          onClick={onCopyCode}
          aria-label={t("profile.copyCode")}
          className="text-white/70 hover:text-[var(--secondary)]"
        >
          {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </span>
      <StatusBadge status={workshop.status} />
      <TypeBadge type={workshop.type} />
      {workshop.flags !== "None" ? <FlagBadge flag={workshop.flags} /> : null}
      <span className="ms-auto text-xs text-muted-foreground">
        {t("profile.addedOn", { date: formatDateUtc(workshop.createdAtUtc) })}
        {workshop.updatedAtUtc
          ? ` · ${t("profile.updatedOn", { date: formatDateUtc(workshop.updatedAtUtc) })}`
          : ""}
      </span>
    </section>
  );
}
