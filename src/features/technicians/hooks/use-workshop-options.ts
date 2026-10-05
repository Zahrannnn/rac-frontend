"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkshops, workshopsKeys } from "@/features/workshops";

/** Workshop picker options — limited to the caller's visible workshops (server scopes anyway). */
export function useWorkshopOptions(enabled: boolean) {
  return useQuery({
    queryKey: workshopsKeys.options(),
    queryFn: async () => {
      const page = await fetchWorkshops({ page: 1 });
      return page.items.map((workshop) => ({
        id: workshop.id,
        code: workshop.code,
        name: workshop.nameAr || workshop.nameEn,
      }));
    },
    enabled,
    staleTime: 60_000,
  });
}
