"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveBlob } from "@/shared/api/file-transfer";
import { useT } from "@/shared/i18n";
import { downloadTrainingPhoto } from "../api/trainings-adapter";
import { useTrainingPhotoMutations } from "../hooks/use-trainings";

export function PhotosSection({
  trainingId,
  canEdit,
  photos,
}: {
  trainingId: string;
  canEdit: boolean;
  photos: { id: string; fileName: string }[];
}) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  const { upload, remove } = useTrainingPhotoMutations(trainingId);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="photos-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="photos-heading" className="text-sm font-semibold text-[var(--navy)]">
          {t("trainings.photos")} ({photos.length})
        </h3>
        {canEdit ? (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  upload.mutate(file, {
                    onSuccess: () => toast.success(t("trainings.photoUploaded")),
                    onError: (error) => {
                      const status = (error as { status?: number }).status;
                      toast.error(
                        status === 400 ? t("trainings.photoInvalid") : t("trainings.photoFailed")
                      );
                    },
                  });
                }
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={upload.isPending}
              onClick={() => fileInput.current?.click()}
            >
              <Camera data-icon="inline-start" />
              {upload.isPending ? t("trainings.photoUploading") : t("trainings.photoAdd")}
            </Button>
          </>
        ) : null}
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("trainings.photosEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <button
                type="button"
                className="truncate text-start text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  void downloadTrainingPhoto(trainingId, photo.id, photo.fileName)
                    .then(({ blob, fileName }) => saveBlob(blob, fileName))
                    .catch(() => toast.error(t("trainings.photoDownloadFailed")));
                }}
              >
                {photo.fileName}
              </button>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(photo.id, {
                      onSuccess: () => toast.success(t("trainings.photoRemoved")),
                      onError: () => toast.error(t("trainings.photoRemoveFailed")),
                    })
                  }
                  aria-label={t("trainings.photoRemove")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
