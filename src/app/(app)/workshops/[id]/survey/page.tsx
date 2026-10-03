import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/features/auth";
import { SurveyWizardPage } from "@/features/surveys";

export const metadata: Metadata = { title: "Survey" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;

  return (
    <RequirePermission anyOf={["surveys:view"]}>
      <Suspense fallback={null}>
        <SurveyWizardPage workshopId={id} stepHint={step} />
      </Suspense>
    </RequirePermission>
  );
}
