import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { AdminHubPage } from "@/features/admin";

export const metadata: Metadata = { title: "Administration" };

export default function Page() {
  return (
    <RequirePermission anyOf={["admin:users", "admin:audit", "admin:permissions"]}>
      <AdminHubPage />
    </RequirePermission>
  );
}
