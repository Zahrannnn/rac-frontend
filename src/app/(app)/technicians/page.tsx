import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { TechniciansPage } from "@/features/technicians";

export const metadata: Metadata = { title: "Technicians" };

export default function Page() {
  return (
    <RequirePermission anyOf={["technicians:view"]}>
      <TechniciansPage />
    </RequirePermission>
  );
}
