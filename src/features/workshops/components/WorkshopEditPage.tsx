"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import { useT } from "@/shared/i18n";
import { routes, workshopProfile } from "@/shared/constants/routes";
import { useWorkshop } from "../hooks/use-workshops";
import { workshopDisplayName } from "../utils/format";
import { WorkshopEditForm } from "./WorkshopEditForm";
import { WorkshopDetailSkeleton, WorkshopNotFoundState } from "./WorkshopLoadStates";

/**
 * Dedicated Edit Workshop page (the former edit dialog). Loads the workshop,
 * then mounts WorkshopEditForm; saving or cancelling returns to the workshop
 * profile. Permission to even reach this page is enforced by the route's
 * RequirePermission (workshops:edit).
 */
export function WorkshopEditPage({ workshopId }: { workshopId: string }) {
  const t = useT();
  const router = useRouter();
  const profileHref = workshopProfile(workshopId);
  const { data: workshop, isPending, isError } = useWorkshop(workshopId);

  if (isPending) {
    return <WorkshopDetailSkeleton />;
  }

  // 404 = missing OR existence-hiding (unassigned FieldTeam) — same graceful state.
  if (isError || !workshop) {
    return <WorkshopNotFoundState />;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageBreadcrumbs
        items={[
          { label: t("workshops.title"), href: routes.workshops },
          { label: workshopDisplayName(workshop), href: profileHref },
          { label: t("workshops.editBreadcrumb") },
        ]}
      />
      <PageHeader title={t("profile.editTitle")} description={t("profile.editHint")}>
        <Button asChild variant="outline">
          <Link href={profileHref}>
            <ArrowLeft data-icon="inline-start" className="rtl:rotate-180" />
            {t("profile.backToProfile")}
          </Link>
        </Button>
      </PageHeader>

      <WorkshopEditForm
        workshop={workshop}
        onSaved={() => router.push(profileHref)}
        onCancel={() => router.push(profileHref)}
      />
    </div>
  );
}
