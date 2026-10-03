import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/features/auth";
import { WorkshopsPage } from "@/features/workshops";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Workshops" };

export default function Page() {
  return (
    <RequirePermission anyOf={["workshops:view"]}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <WorkshopsPage />
      </Suspense>
    </RequirePermission>
  );
}
