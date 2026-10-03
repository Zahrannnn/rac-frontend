"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { useTraining, useTrainingPhotos } from "../hooks/use-trainings";
import { AttendeesSection } from "./AttendeesSection";
import { PhotosSection } from "./PhotosSection";

export function TrainingDetailDialog({
  trainingId,
  onOpenChange,
  canEdit,
}: {
  trainingId: string | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}) {
  const t = useT();
  const { data, isPending, isError, refetch } = useTraining(trainingId);
  const { data: photos } = useTrainingPhotos(trainingId);
  const attendees = data?.attendees;
  const showAttendees = Array.isArray(attendees);

  return (
    <Dialog open={Boolean(trainingId)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-y-auto sm:max-w-3xl">
        <div>
          <DialogTitle>{data?.title || data?.trainerName || t("trainings.detailTitle")}</DialogTitle>
          <DialogDescription>
            {data
              ? `${data.venue} · ${formatDateTimeUtc(data.startAtUtc)} → ${formatDateTimeUtc(data.endAtUtc)} UTC`
              : t("common.loading")}
          </DialogDescription>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-2" aria-busy>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError || !data ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <p>{t("common.error")}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">{t("trainings.trainerName")}</dt>
                <dd className="font-medium">{data.trainerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("trainings.governorate")}</dt>
                <dd className="font-medium">{data.governorate}</dd>
              </div>
              {data.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">{t("trainings.notes")}</dt>
                  <dd className="whitespace-pre-wrap">{data.notes}</dd>
                </div>
              ) : null}
            </dl>

            {showAttendees && trainingId ? (
              <AttendeesSection trainingId={trainingId} attendees={attendees} canEdit={canEdit} />
            ) : (
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {t("trainings.privacyNote")}
              </p>
            )}

            {trainingId ? (
              <PhotosSection trainingId={trainingId} canEdit={canEdit} photos={photos ?? []} />
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
