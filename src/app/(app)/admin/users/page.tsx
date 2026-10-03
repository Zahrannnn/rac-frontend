import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { UsersTab } from "@/features/admin";

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return (
    <RequirePermission anyOf={["admin:users"]}>
      <UsersTab />
    </RequirePermission>
  );
}
