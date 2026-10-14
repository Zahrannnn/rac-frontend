"use client";

import { TrainingLoadError } from "@/features/trainings";

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <TrainingLoadError onRetry={retry} />;
}
