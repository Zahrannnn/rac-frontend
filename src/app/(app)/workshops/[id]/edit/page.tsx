import type { Metadata } from "next";
import { RequirePermission } from "@/features/auth";
import { WorkshopEditPage } from "@/features/workshops";

export const metadata: Metadata = { title: "Edit workshop" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <RequirePermission anyOf={["workshops:edit"]}>
      <WorkshopEditPage workshopId={id} />
    </RequirePermission>
  );
}
