import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { AuditTab } from "@/features/admin";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return (
    <RequirePermission anyOf={["admin:audit"]}>
      <AuditTab />
    </RequirePermission>
  );
}
