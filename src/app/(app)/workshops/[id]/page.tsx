import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequirePermission } from "@/features/auth";
import { WorkshopProfilePage } from "@/features/workshops";

export const metadata: Metadata = { title: "Workshop profile" };

function ProfileFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkshopProfilePage workshopId={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RequirePermission anyOf={["workshops:view"]}>
      <Suspense fallback={<ProfileFallback />}>
        <Profile params={params} />
      </Suspense>
    </RequirePermission>
  );
}
