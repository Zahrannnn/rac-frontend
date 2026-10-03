import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { RegisterWorkshopPage } from "@/features/workshops";

export const metadata: Metadata = { title: "Register workshop" };

export default function Page() {
  return (
    <RequirePermission anyOf={["workshops:create"]}>
      <RegisterWorkshopPage />
    </RequirePermission>
  );
}
