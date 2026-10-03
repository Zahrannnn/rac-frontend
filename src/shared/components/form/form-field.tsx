"use client";

import React, { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/cn";

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Labeled form control: wires the label to the injected child via useId and
 * exposes hint/error through aria-describedby. The child must accept the
 * injected `id` (inputs, selects and textareas all do).
 */
export function FormField({ label, required, error, hint, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const control = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ id?: string; "aria-describedby"?: string }>,
        {
          id,
          "aria-describedby": [hint && !error ? hintId : null, error ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined,
        }
      )
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </Label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
