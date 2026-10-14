"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveBlob } from "@/shared/api/file-transfer";
import { Section } from "@/shared/components/section";
import { useT } from "@/shared/i18n";
import { prepareImageForUpload } from "@/shared/utils/image-compression";
import { downloadTrainingPhoto } from "../api/trainings-adapter";
import { useTrainingPhotoMutations } from "../hooks/use-trainings";

/** Training photo strip — originals up to 20MB are compressed client-side to
 * WebP (stored cap 4MB, the backend mirror) before upload. */
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

  async function handlePick(file: File) {
    const result = await prepareImageForUpload(file);
    if (!result.ok) {
      if (result.reason === "decode-failed") {
        toast.error(t("trainings.photoFailed"));
      } else {
        toast.error(
          t(
            result.reason === "input-too-large"
              ? "trainings.photoTooLargeInput"
              : "trainings.photoTooLarge"
          )
        );
      }
      return;
    }
    upload.mutate(result.file, {
      onSuccess: () => toast.success(t("trainings.photoUploaded")),
      onError: (error) => {
        const status = (error as { status?: number }).status;
        toast.error(status === 400 ? t("trainings.photoInvalid") : t("trainings.photoFailed"));
      },
    });
  }

  return (
    <Section
      title={`${t("trainings.photos")} (${photos.length})`}
      headingId="photos-heading"
      action={
        canEdit ? (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void handlePick(file);
                }
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
        ) : null
      }
    >

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
    </Section>
  );
}
