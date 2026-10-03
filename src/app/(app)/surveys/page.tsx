import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { SurveysPage } from "@/features/surveys";

export const metadata: Metadata = { title: "Surveys" };

export default function Page() {
  return (
    <RequirePermission anyOf={["surveys:view"]}>
      <SurveysPage />
    </RequirePermission>
  );
}
