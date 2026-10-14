import { useQuery } from "@tanstack/react-query";
import { racApi } from "@/shared/api/rac-api";
import { adminKeys } from "@/features/admin";

type AdminUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
};

/** FieldTeams picker — the users endpoint is admin:users-gated; 403 degrades gracefully. */
export function useFieldTeamsUsers(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.users.fieldTeams(),
    queryFn: async () => {
      const { data } = await racApi.get<{ items: AdminUser[] }>("/admin/users", {
        params: { page: 1, pageSize: 100 },
      });
      return data.items.filter((user) => user.role === "FieldTeams" && user.isActive);
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}
