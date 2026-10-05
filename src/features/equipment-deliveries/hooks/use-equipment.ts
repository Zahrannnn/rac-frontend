"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDelivery,
  deleteDelivery,
  deleteDeliveryPhoto,
  fetchDeliveries,
  fetchDelivery,
  fetchDeliveryPhotos,
  updateDelivery,
  uploadDeliveryPhoto,
} from "../api/equipment-adapter";
import { equipmentDeliveryKeys } from "../utils/query-keys";
import type { CreateDeliveryPayload, DeliveryListFilters, UpdateDeliveryPayload } from "../types";

export function useDeliveries(filters: DeliveryListFilters) {
  return useQuery({
    queryKey: equipmentDeliveryKeys.list(filters),
    queryFn: () => fetchDeliveries(filters),
    placeholderData: (previous) => previous,
  });
}

export function useDelivery(id: string | null) {
  return useQuery({
    queryKey: equipmentDeliveryKeys.detail(id),
    queryFn: () => fetchDelivery(id!),
    enabled: Boolean(id),
  });
}

export function useDeliveryPhotos(deliveryId: string | null) {
  return useQuery({
    queryKey: equipmentDeliveryKeys.photos(deliveryId),
    queryFn: () => fetchDeliveryPhotos(deliveryId!),
    enabled: Boolean(deliveryId),
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeliveryPayload) => createDelivery(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: equipmentDeliveryKeys.all() });
    },
  });
}

export function useUpdateDelivery(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDeliveryPayload) => updateDelivery(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: equipmentDeliveryKeys.all() });
    },
  });
}

export function useDeleteDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDelivery(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: equipmentDeliveryKeys.all() });
    },
  });
}

export function useDeliveryPhotoMutations(deliveryId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: equipmentDeliveryKeys.photos(deliveryId),
    });
    void queryClient.invalidateQueries({ queryKey: equipmentDeliveryKeys.all() });
  };

  return {
    upload: useMutation({
      mutationFn: (file: File) => uploadDeliveryPhoto(deliveryId, file),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (photoId: string) => deleteDeliveryPhoto(deliveryId, photoId),
      onSuccess: invalidate,
    }),
  };
}
