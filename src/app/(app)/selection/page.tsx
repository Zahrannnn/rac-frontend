import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { SelectionPage } from "@/features/selection";

export const metadata: Metadata = { title: "Selection" };

export default function Page() {
  return (
    <RequirePermission anyOf={["selection:view"]}>
      <SelectionPage />
    </RequirePermission>
  );
}
