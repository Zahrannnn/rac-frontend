"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { saveBlob } from "@/shared/api/file-transfer";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { downloadDeliveryPhoto } from "../api/equipment-adapter";
import {
  useDelivery,
  useDeliveryPhotoMutations,
  useDeliveryPhotos,
} from "../hooks/use-equipment";

export function DeliveryDetailDialog({
  deliveryId,
  onOpenChange,
  canEdit,
  onEdit,
}: {
  deliveryId: string | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const t = useT();
  const { data, isPending, isError, refetch } = useDelivery(deliveryId);
  const { data: photos } = useDeliveryPhotos(deliveryId);
  const fileInput = useRef<HTMLInputElement>(null);
  const mutations = useDeliveryPhotoMutations(deliveryId ?? "");

  return (
    <Dialog open={Boolean(deliveryId)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-4 overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle>{t("equipment.detailTitle")}</DialogTitle>
          <DialogDescription>
            {data
              ? `${data.workshopCode} · ${formatDateTimeUtc(data.deliveredAtUtc)} UTC`
              : t("common.loading")}
          </DialogDescription>
        </div>

        {isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : isError || !data ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <p>{t("common.error")}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t("equipment.workshop")}</dt>
                <dd className="font-medium">
                  {data.workshopCode} · {data.workshopName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("equipment.description")}</dt>
                <dd className="whitespace-pre-wrap">{data.equipmentDescription}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("equipment.recipientName")}</dt>
                <dd>
                  {data.recipientName}
                  {data.recipientPhone ? ` · ${data.recipientPhone}` : ""}
                </dd>
              </div>
              {data.notes ? (
                <div>
                  <dt className="text-xs text-muted-foreground">{t("equipment.notes")}</dt>
                  <dd className="whitespace-pre-wrap">{data.notes}</dd>
                </div>
              ) : null}
            </dl>

            {canEdit ? (
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                {t("equipment.edit")}
              </Button>
            ) : null}

            <section className="flex flex-col gap-2" aria-labelledby="eq-photos">
              <div className="flex items-center justify-between gap-2">
                <h3 id="eq-photos" className="text-sm font-semibold text-[var(--navy)]">
                  {t("equipment.photos")} ({photos?.length ?? data.photoCount})
                </h3>
                {canEdit && deliveryId ? (
                  <>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          mutations.upload.mutate(file, {
                            onSuccess: () => toast.success(t("equipment.photoUploaded")),
                            onError: (error) => {
                              const status = (error as { status?: number }).status;
                              toast.error(
                                status === 400
                                  ? t("equipment.photoInvalid")
                                  : t("equipment.photoFailed")
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
                      disabled={mutations.upload.isPending}
                      onClick={() => fileInput.current?.click()}
                    >
                      <Camera data-icon="inline-start" />
                      {t("equipment.photoAdd")}
                    </Button>
                  </>
                ) : null}
              </div>
              {(photos ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("equipment.photosEmpty")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(photos ?? []).map((photo) => (
                    <li
                      key={photo.id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
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
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
