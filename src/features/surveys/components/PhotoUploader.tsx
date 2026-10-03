"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/i18n";
import { usePhotoMutations, useSurveyPhotos } from "../hooks/use-survey";
import { photoUrl } from "../api/surveys-adapter";

/**
 * Section-scoped photo uploader: camera capture on mobile, thumbnails with
 * delete. Backend limits: 8 photos/survey, 512 KB each — errors surface as toasts.
 */
export function PhotoUploader({
  surveyId,
  sectionKey,
  label,
  hideLabel = false,
}: {
  surveyId: string;
  sectionKey: string;
  label: string;
  hideLabel?: boolean;
}) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: photos, isPending } = useSurveyPhotos(surveyId);
  const { upload, remove } = usePhotoMutations(surveyId);
  // The list endpoint returns EVERY photo of the survey — keep this section's
  // photos only (sectionKey round-trips on the photo contract).
  const sectionPhotos = (photos ?? []).filter((p) => p.sectionKey === sectionKey);

  function pick() {
    fileInput.current?.click();
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <p className="text-sm font-medium">{label}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Backend mirror: photos over 512 KB are rejected — block before the
          // round trip so field surveyors get instant feedback.
          if (file && file.size > 512 * 1024) {
            toast.warning(t("survey.photoTooLarge"));
            event.target.value = "";
            return;
          }
          if (file) {
            upload.mutate(
              { file, sectionKey },
              {
                onSuccess: () => toast.success(t("survey.photoUploaded")),
                onError: (error) => {
                  const status = (error as { status?: number }).status;
                  if (status === 409) {
                    toast.warning(t("survey.photoLimit"));
                  } else if (status === 400) {
                    toast.warning(t("survey.photoTooLarge"));
                  } else if (status !== 403) {
                    toast.error(`${t("common.error")} — ${t("common.retry")}`);
                  }
                },
              }
            );
          }
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={pick} disabled={upload.isPending}>
          <Camera data-icon="inline-start" className="h-4 w-4" />
          {upload.isPending ? t("survey.photoUploading") : t("survey.photoAdd")}
        </Button>
        {sectionPhotos.length > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {sectionPhotos.length}
          </span>
        ) : null}
      </div>

      {isPending ? (
        <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
      ) : sectionPhotos.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {sectionPhotos.map((photo) => (
            <li key={photo.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- auth-required
                  endpoint (Bearer header) that next/image loaders cannot attach */}
              <img
                src={photoUrl(surveyId, photo.id)}
                alt={photo.fileName}
                loading="lazy"
                decoding="async"
                className="size-20 rounded-md border object-cover"
              />
              <button
                type="button"
                aria-label={`${t("survey.photoDelete")} ${photo.fileName}`}
                className="absolute -end-1.5 -top-1.5 grid size-6 place-items-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-destructive"
                onClick={() =>
                  remove.mutate(photo.id, {
                    onSuccess: () => toast.success(t("survey.photoDeleted")),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
