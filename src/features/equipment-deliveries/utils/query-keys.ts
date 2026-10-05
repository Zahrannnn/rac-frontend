import type { DeliveryListFilters } from "../types";

/**
 * Query-key factory for the equipment-deliveries feature — the single source
 * of truth for every "equipment-deliveries" cache key. Tuples mirror the
 * literals used before the factory existed so existing cache entries keep
 * working.
 */
export const equipmentDeliveryKeys = {
  /** Prefix invalidating every equipment-deliveries key (lists, details, photos). */
  all: () => ["equipment-deliveries"] as const,
  list: (filters: DeliveryListFilters) => ["equipment-deliveries", "list", filters] as const,
  detail: (id: string | null) => ["equipment-deliveries", "detail", id] as const,
  photos: (deliveryId: string | null) => ["equipment-deliveries", "photos", deliveryId] as const,
};
