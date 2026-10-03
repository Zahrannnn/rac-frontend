"use client";

import { useQuery } from "@tanstack/react-query";
// Deep import — the feature barrel re-exports page components, which would
// drag the whole workshops UI into the technicians route graph.
import { fetchWorkshops } from "@/features/workshops/api/workshops-adapter";

/** Workshop picker options — limited to the caller's visible workshops (server scopes anyway). */
export function useWorkshopOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["workshops", "options"],
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
