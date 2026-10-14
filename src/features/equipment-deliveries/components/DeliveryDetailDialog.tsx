"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { saveBlob } from "@/shared/api/file-transfer";
import { DetailItem, DetailList } from "@/shared/components/detail-list";
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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t("equipment.detailTitle")}</DialogTitle>
          <DialogDescription className="tabular-nums">
            {data
              ? `${data.workshopCode} · ${formatDateTimeUtc(data.deliveredAtUtc)} UTC`
              : t("common.loading")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isPending ? (
            <div className="flex flex-col gap-3" aria-busy>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError || !data ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              <p>{t("common.error")}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <>
              <DetailList>
                <DetailItem label={t("equipment.workshop")} wide>
                  <span className="font-medium">
                    {data.workshopCode} · {data.workshopName}
                  </span>
                </DetailItem>
                <DetailItem label={t("equipment.recipientName")}>
                  {data.recipientName}
                  {data.recipientPhone ? (
                    <span className="block text-muted-foreground">
                      <span className="tabular-nums" dir="ltr">
                        {data.recipientPhone}
                      </span>
                    </span>
                  ) : null}
                </DetailItem>
                <DetailItem label={t("equipment.deliveredAt")}>
                  <span className="tabular-nums">
                    {formatDateTimeUtc(data.deliveredAtUtc)} UTC
                  </span>
                </DetailItem>
                <DetailItem label={t("equipment.description")} wide>
                  <span className="whitespace-pre-wrap">{data.equipmentDescription}</span>
                </DetailItem>
                {data.notes ? (
                  <DetailItem label={t("equipment.notes")} wide>
                    <span className="whitespace-pre-wrap">{data.notes}</span>
                  </DetailItem>
                ) : null}
              </DetailList>

              <DialogSection
                aria-labelledby="eq-photos"
                className="border-t pt-5"
                title={
                  <span id="eq-photos">
                    {t("equipment.photos")} ({photos?.length ?? data.photoCount})
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
            </>
          )}
        </DialogBody>

        {canEdit && !isPending && !isError && data ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onEdit}>
              {t("equipment.edit")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
