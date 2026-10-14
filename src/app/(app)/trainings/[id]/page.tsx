import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirePermission } from "@/features/auth";
import { TrainingDetailPage } from "@/features/trainings";

export const metadata: Metadata = { title: "Training session" };

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!GUID.test(id)) {
    notFound();
  }

  return (
    <RequirePermission anyOf={["trainings:view"]}>
      <TrainingDetailPage trainingId={id} />
    </RequirePermission>
  );
}
