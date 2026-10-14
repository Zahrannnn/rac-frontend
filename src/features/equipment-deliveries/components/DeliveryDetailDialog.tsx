"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailItem, DetailList } from "@/shared/components/detail-list";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { useDelivery, useDeliveryPhotoMutations, useDeliveryPhotos } from "../hooks/use-equipment";
import { DeliveryPhotosSection } from "./DeliveryPhotosSection";

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

              <DeliveryPhotosSection
                deliveryId={deliveryId}
                canEdit={canEdit}
                photos={photos}
                photoCount={data.photoCount}
                mutations={mutations}
              />
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
