"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { workshopEdit, routes } from "@/shared/constants/routes";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import { useAuth, can } from "@/features/auth";
import { useMounted } from "@/shared/hooks/use-mounted";
import { useWorkshop } from "../hooks/use-workshops";
import { formatDateUtc, workshopDisplayName } from "../utils/format";
import type { Workshop } from "../types";
import { FlagBadge, StatusBadge, TypeBadge } from "./badges";
import { WorkshopDetailSkeleton, WorkshopNotFoundState } from "./WorkshopLoadStates";
import { WorkshopProfileTabs, isProfileTab, type ProfileTab } from "./WorkshopProfileTabs";

export function WorkshopProfilePage({ workshopId }: { workshopId: string }) {
  const t = useT();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const { data: workshop, isPending, isError } = useWorkshop(workshopId);
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
      <PageBreadcrumbs
        items={[
          { label: t("workshops.title"), href: routes.workshops },
          { label: workshopDisplayName(workshop) },
        ]}
      />
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

      <WorkshopProfileTabs
        workshop={workshop}
        activeTab={activeTab}
        onTabChange={setTab}
        canEdit={canEdit}
        canAssign={canAssign}
        canStartSurvey={canStartSurvey}
      />
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
