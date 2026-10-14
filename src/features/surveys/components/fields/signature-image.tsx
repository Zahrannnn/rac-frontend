"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { compressSignatureImage } from "../../utils/signature-image";

/**
 * Signature capture as an IMAGE (questionnaire Ver3): the surveyor photographs
 * the wet signature on paper (camera `capture="environment"` on mobile, file
 * pick on desktop); the browser compresses it to a ≤400KB WebP data URL (JPEG
 * fallback, EXIF stripped by the canvas re-encode) and the data URL is stored
 * under the field key — same required/optional shape as the old drawn pad.
 */
export function SignatureImage({
  label,
  hideLabel = false,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setProcessing(true);
    try {
      onChange(await compressSignatureImage(file));
    } catch {
      toast.error(t("survey.signatureCapture.error"));
    } finally {
      setProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label>{label}</Label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {value ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL
              preview that next/image loaders cannot optimize */}
          <img
            src={value}
            alt={label}
            className="h-16 w-40 rounded-md border bg-white object-contain"
          />
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={processing}
              onClick={() => inputRef.current?.click()}
            >
              <Camera data-icon="inline-start" className="h-4 w-4" />
              {processing ? t("survey.signatureCapture.processing") : t("survey.signatureCapture.retake")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 data-icon="inline-start" className="h-4 w-4" />
              {t("survey.signatureCapture.remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={processing}
              onClick={() => inputRef.current?.click()}
            >
              <Camera data-icon="inline-start" className="h-4 w-4" />
              {processing ? t("survey.signatureCapture.processing") : t("survey.signatureCapture.add")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("survey.signatureCapture.hint")}</p>
        </div>
      )}
    </div>
  );
}
