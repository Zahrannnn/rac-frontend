"use client";

import { can, useAuth } from "@/features/auth";
import { DetailItem, DetailList } from "@/shared/components/detail-list";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Section } from "@/shared/components/section";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { useTraining, useTrainingPhotos } from "../hooks/use-trainings";
import type { TrainingDetails } from "../types";
import { AttendeesSection } from "./AttendeesSection";
import { PhotosSection } from "./PhotosSection";
import { BackToTrainings, TrainingDetailSkeleton, TrainingLoadError } from "./TrainingDetailStates";
import { TrainingNotFound } from "./TrainingNotFound";

/** Side-column card; padding matches the dialog gutters. */
const CARD_CLASS = "rounded-xl border bg-card p-5 sm:p-6";

function SessionDetails({ training, className }: { training: TrainingDetails; className?: string }) {
  const t = useT();
  const { locale } = useI18n();
  return (
    <Section
      title={t("trainings.sessionDetails")}
      headingId="session-details-heading"
      className={cn(CARD_CLASS, className)}
    >
      {/* Two columns while the card spans the page; one in the narrow side column. */}
      <DetailList className="lg:grid-cols-1">
        <DetailItem label={t("trainings.trainerName")}>
          <span className="font-medium" dir="auto">
            {training.trainerName}
          </span>
        </DetailItem>
        <DetailItem label={t("trainings.venue")}>
          <span dir="auto">{training.venue}</span>
        </DetailItem>
        <DetailItem label={t("trainings.governorate")}>
          {governorateLabel(training.governorate, locale)}
        </DetailItem>
        <DetailItem label={t("trainings.startAt")}>
          <bdi dir="ltr" className="tabular-nums">
            {formatDateTimeUtc(training.startAtUtc)}
          </bdi>
        </DetailItem>
        <DetailItem label={t("trainings.endAt")}>
          <bdi dir="ltr" className="tabular-nums">
            {formatDateTimeUtc(training.endAtUtc)}
          </bdi>
        </DetailItem>
        {training.notes ? (
          <DetailItem label={t("trainings.notes")} wide>
            <span className="whitespace-pre-wrap" dir="auto">
              {training.notes}
            </span>
          </DetailItem>
        ) : null}
      </DetailList>
    </Section>
  );
}

/** Training session page (deep-linkable): session facts, participants, photos. */
export function TrainingDetailPage({ trainingId }: { trainingId: string }) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const canEdit = Boolean(user && can(user.permissions, "trainings:edit"));
  const { data, isPending, isError, error, refetch, isRefetching } = useTraining(trainingId);
  const { data: photos } = useTrainingPhotos(data ? trainingId : null);

  if (isPending) {
    return <TrainingDetailSkeleton />;
  }

  // TrainingsScope answers 404 for sessions outside a trainer's own scope too.
  if ((error as { status?: number } | null)?.status === 404) {
    return <TrainingNotFound />;
  }

  if (isError || !data) {
    return <TrainingLoadError onRetry={() => void refetch()} retrying={isRefetching} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackToTrainings />
        <PageHeader
          title={data.title || data.trainerName}
          description={`${data.venue} · ${governorateLabel(data.governorate, locale)}`}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr]">
        <SessionDetails training={data} className="lg:col-start-2 lg:row-start-1" />

        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <AttendeesSection
            trainingId={trainingId}
            attendees={data.attendees ?? []}
            canEdit={canEdit}
          />
        </div>

        <div className={cn(CARD_CLASS, "lg:col-start-2 lg:row-start-2")}>
          <PhotosSection trainingId={trainingId} canEdit={canEdit} photos={photos ?? []} />
        </div>
      </div>
    </div>
  );
}
