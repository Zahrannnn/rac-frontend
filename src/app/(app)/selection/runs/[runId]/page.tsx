import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequirePermission } from "@/features/auth";
import { SelectionRunDetailPage } from "@/features/selection";

export const metadata: Metadata = { title: "Selection run" };

function RunFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-6 w-72" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

/** Params must be awaited inside Suspense — awaiting in the page body breaks
 * prerendering (Next 16 Instant Navigation). */
async function Run({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <SelectionRunDetailPage runId={runId} />;
}

export default function Page({ params }: { params: Promise<{ runId: string }> }) {
  return (
    <RequirePermission anyOf={["selection:view"]}>
      <Suspense fallback={<RunFallback />}>
        <Run params={params} />
      </Suspense>
    </RequirePermission>
  );
}
