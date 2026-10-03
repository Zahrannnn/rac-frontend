/** Equipment Delivery Records — contracts mirror EquipmentDeliveryEndpoints.cs. */

export type EquipmentDelivery = {
  id: string;
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  equipmentDescription: string;
  recipientName: string;
  recipientPhone: string | null;
  deliveredAtUtc: string;
  deliveredBy: string | null;
  notes: string | null;
  photoCount: number;
  createdAtUtc: string;
  updatedAtUtc: string | null;
};

export type DeliveryPhoto = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId?: string | null;
  uploadedAtUtc?: string | null;
};

export type DeliveryListFilters = {
  page: number;
  workshopId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type CreateDeliveryPayload = {
  workshopId: string;
  equipmentDescription: string;
  recipientName: string;
  recipientPhone?: string | null;
  deliveredAtUtc: string;
  notes?: string | null;
};

export type UpdateDeliveryPayload = {
  equipmentDescription?: string;
  recipientName?: string;
  recipientPhone?: string | null;
  deliveredAtUtc?: string;
  notes?: string | null;
};
