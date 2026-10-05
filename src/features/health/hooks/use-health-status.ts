"use client";

import { useQuery } from "@tanstack/react-query";
import { getHealthStatus } from "../api/health-client";
import { healthKeys } from "../utils/query-keys";

export function useHealthStatus() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: getHealthStatus,
    refetchInterval: 30_000,
  });
}
