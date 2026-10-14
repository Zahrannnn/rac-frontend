"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { ScoreKey } from "../hooks/use-candidate-add";

/** Optional pre/post scores applied to the next participant the picker adds. */
export function NextAddScoreFields({
  baseId,
  errorId,
  scores,
  invalid,
  onScoreChange,
  onSubmit,
}: {
  baseId: string;
  errorId: string;
  scores: Record<ScoreKey, string>;
  invalid: boolean;
  onScoreChange: (key: ScoreKey, raw: string) => void;
  /** Enter in a score field adds the highlighted candidate. */
  onSubmit: () => boolean;
}) {
  const t = useT();
  const fields = [
    ["pre", t("trainings.preScoreShort")],
    ["post", t("trainings.postScoreShort")],
  ] as const;

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
        {t("trainings.nextAddScores")}
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        {fields.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Label
              htmlFor={`${baseId}-${key}`}
              className="shrink-0 text-xs font-normal text-muted-foreground"
            >
              {label}
            </Label>
            <Input
              id={`${baseId}-${key}`}
              inputMode="numeric"
              maxLength={3}
              dir="ltr"
              placeholder="0-100"
              value={scores[key]}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? errorId : undefined}
              onChange={(event) => onScoreChange(key, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && onSubmit()) {
                  event.preventDefault();
                }
              }}
              className={cn(
                "h-11 w-full text-center tabular-nums sm:w-20",
                invalid && "border-destructive"
              )}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
