import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequirePermission } from "@/features/auth";
import { SurveyWizardPage } from "@/features/surveys";

export const metadata: Metadata = { title: "Survey" };

function SurveyFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

async function Survey({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
  return <SurveyWizardPage workshopId={id} stepHint={step} />;
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  return (
    <RequirePermission anyOf={["surveys:view"]}>
      <Suspense fallback={<SurveyFallback />}>
        <Survey params={params} searchParams={searchParams} />
      </Suspense>
    </RequirePermission>
  );
}
