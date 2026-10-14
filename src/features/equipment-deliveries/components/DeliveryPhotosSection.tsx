"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogSection } from "@/components/ui/dialog";
import { saveBlob } from "@/shared/api/file-transfer";
import { useT } from "@/shared/i18n";
import { prepareImageForUpload } from "@/shared/utils/image-compression";
import { downloadDeliveryPhoto } from "../api/equipment-adapter";
import type { useDeliveryPhotoMutations } from "../hooks/use-equipment";
import type { DeliveryPhoto } from "../types";

/** Photo strip of the delivery detail dialog — upload, download, remove.
 * The queries and mutations stay with the dialog; this is the UI over them.
 * Originals up to 20MB are compressed client-side to WebP (stored cap 4MB,
 * the backend mirror) before upload. */
export function DeliveryPhotosSection({
  deliveryId,
  canEdit,
  photos,
  photoCount,
  mutations,
}: {
  deliveryId: string | null;
  canEdit: boolean;
  photos: DeliveryPhoto[] | undefined;
  photoCount: number;
  mutations: ReturnType<typeof useDeliveryPhotoMutations>;
}) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);

  async function handlePick(file: File) {
    const result = await prepareImageForUpload(file);
    if (!result.ok) {
      if (result.reason === "decode-failed") {
        toast.error(t("equipment.photoFailed"));
      } else {
        toast.error(
          t(
            result.reason === "input-too-large"
              ? "equipment.photoTooLargeInput"
              : "equipment.photoTooLarge"
          )
        );
      }
      return;
    }
    mutations.upload.mutate(result.file, {
      onSuccess: () => toast.success(t("equipment.photoUploaded")),
      onError: (error) => {
        const status = (error as { status?: number }).status;
        toast.error(status === 400 ? t("equipment.photoInvalid") : t("equipment.photoFailed"));
      },
    });
  }

  return (
    <DialogSection
      aria-labelledby="eq-photos"
      className="border-t pt-5"
      title={
        <span id="eq-photos">
          {t("equipment.photos")} ({photos?.length ?? photoCount})
        </span>
      }
      action={
        canEdit && deliveryId ? (
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
              disabled={mutations.upload.isPending}
              onClick={() => fileInput.current?.click()}
            >
              <Camera data-icon="inline-start" />
              {t("equipment.photoAdd")}
            </Button>
          </>
        ) : null
      }
    >
      {(photos ?? []).length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("equipment.photosEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border">
          {(photos ?? []).map((photo) => (
            <li
              key={photo.id}
              className="flex min-h-11 items-center justify-between gap-2 px-3 py-1.5 text-sm"
            >
              <button
                type="button"
                className="truncate text-start text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  if (!deliveryId) return;
                  void downloadDeliveryPhoto(deliveryId, photo.id, photo.fileName)
                    .then(({ blob, fileName }) => saveBlob(blob, fileName))
                    .catch(() => toast.error(t("equipment.photoFailed")));
                }}
              >
                {photo.fileName}
              </button>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={mutations.remove.isPending}
                  onClick={() =>
                    mutations.remove.mutate(photo.id, {
                      onSuccess: () => toast.success(t("equipment.photoRemoved")),
                    })
                  }
                  aria-label={t("equipment.photoRemove")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DialogSection>
  );
}
