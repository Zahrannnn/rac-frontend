import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { PermissionsTab } from "@/features/admin";

export const metadata: Metadata = { title: "Permission matrix" };

export default function Page() {
  return (
    <RequirePermission anyOf={["admin:permissions"]}>
      <PermissionsTab />
    </RequirePermission>
  );
}
