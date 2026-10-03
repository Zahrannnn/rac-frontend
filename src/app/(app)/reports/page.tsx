import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { ReportsPage } from "@/features/reports";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <RequirePermission anyOf={["reports:generate"]}>
      <ReportsPage />
    </RequirePermission>
  );
}
