"use client";

import { toast } from "sonner";
import { saveBlob } from "@/shared/api/file-transfer";
import { useT } from "@/shared/i18n";
import { useExportSelectionRun } from "./use-selection";

/**
 * The shared "export this run" action for Screen 05: triggers the export
 * mutation, saves the returned blob and toasts the outcome. `exportPending`
 * drives the disabled state of the export buttons while a download is in
 * flight.
 */
export function useSelectionRunExport() {
  const t = useT();
  const exportRun = useExportSelectionRun();

  const download = (runId: string) => {
    exportRun.mutate(runId, {
      onSuccess: ({ blob, fileName }) => {
        saveBlob(blob, fileName);
        toast.success(t("selection.runs.exported"));
      },
      onError: () => toast.error(t("selection.runs.exportFailed")),
    });
  };

  return { download, exportPending: exportRun.isPending };
}
