import { racApi } from "@/shared/api/rac-api";
import { downloadBlob } from "@/shared/api/file-transfer";
import type { PagedResult } from "@/shared/api/paged-result";
import type {
  CreateDeliveryPayload,
  DeliveryListFilters,
  DeliveryPhoto,
  EquipmentDelivery,
  UpdateDeliveryPayload,
} from "../types";

export const DELIVERIES_PAGE_SIZE = 20;

export async function fetchDeliveries(
  filters: DeliveryListFilters
): Promise<PagedResult<EquipmentDelivery>> {
  const { data } = await racApi.get<PagedResult<EquipmentDelivery>>("/equipment-deliveries", {
    params: {
      page: filters.page,
      pageSize: DELIVERIES_PAGE_SIZE,
      workshopId: filters.workshopId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
  });
  return data;
}

export async function fetchDelivery(id: string): Promise<EquipmentDelivery> {
  const { data } = await racApi.get<EquipmentDelivery>(`/equipment-deliveries/${id}`);
  return data;
}

export async function createDelivery(payload: CreateDeliveryPayload): Promise<EquipmentDelivery> {
  const { data } = await racApi.post<EquipmentDelivery>("/equipment-deliveries", payload);
  return data;
}

export async function updateDelivery(
  id: string,
  payload: UpdateDeliveryPayload
): Promise<EquipmentDelivery> {
  const { data } = await racApi.put<EquipmentDelivery>(`/equipment-deliveries/${id}`, payload);
  return data;
}

export async function deleteDelivery(id: string): Promise<void> {
  await racApi.delete(`/equipment-deliveries/${id}`);
}

export async function fetchDeliveryPhotos(deliveryId: string): Promise<DeliveryPhoto[]> {
  const { data } = await racApi.get<DeliveryPhoto[]>(`/equipment-deliveries/${deliveryId}/photos`);
  return data;
}

export async function uploadDeliveryPhoto(
  deliveryId: string,
  file: File
): Promise<DeliveryPhoto> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await racApi.post<DeliveryPhoto>(
    `/equipment-deliveries/${deliveryId}/photos`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deleteDeliveryPhoto(deliveryId: string, photoId: string): Promise<void> {
  await racApi.delete(`/equipment-deliveries/${deliveryId}/photos/${photoId}`);
}

export async function downloadDeliveryPhoto(
  deliveryId: string,
  photoId: string,
  fileName: string
): Promise<{ blob: Blob; fileName: string }> {
  return downloadBlob(
    racApi,
    `/equipment-deliveries/${deliveryId}/photos/${photoId}`,
    fileName
  );
}
