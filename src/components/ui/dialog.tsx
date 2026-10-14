"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { Section, type SectionProps } from "@/shared/components/section";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Width scale. sm: confirmations · md: short forms · lg: two-column forms and
 * detail views · xl: tables. Below the cap every size fills the viewport minus
 * a 12px margin per side, so phones get a near-full-width sheet.
 */
const DIALOG_SIZES = {
  sm: "max-w-[26rem]",
  md: "max-w-[34rem]",
  lg: "max-w-[44rem]",
  xl: "max-w-[56rem]",
} as const;

export type DialogSize = keyof typeof DIALOG_SIZES;

const GUTTER_X = "px-5 sm:px-6";

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  // pe-14 keeps the title clear of the absolutely positioned close button.
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex shrink-0 flex-col gap-1.5 ps-5 pe-14 pt-5 pb-4 sm:ps-6 sm:pt-6", className)}
      {...props}
    />
  );
}

/** The only scrolling region: header and footer stay put while this scrolls. */
export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-1 pb-6 [scrollbar-width:thin]",
        GUTTER_X,
        className
      )}
      {...props}
    />
  );
}

/** Actions row. Primary action goes last so it lands on the logical end. */
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-muted/40 py-4 [&>button]:flex-1 [&>button]:whitespace-nowrap sm:[&>button]:flex-none",
        GUTTER_X,
        className
      )}
      {...props}
    />
  );
}

/** Titled group inside a DialogBody; `action` sits on the logical end of the heading row. */
export function DialogSection(props: Omit<SectionProps, "level">) {
  return <Section level={3} {...props} />;
}

// Content without header/body/footer slots (legacy markup) gets padding and
// scrolls as a whole instead.
const LEGACY_LAYOUT =
  "[&:not(:has(>[data-slot]))]:overflow-y-auto [&:not(:has(>[data-slot]))]:p-5 [&:not(:has(>[data-slot]))]:pe-14 sm:[&:not(:has(>[data-slot]))]:p-6 sm:[&:not(:has(>[data-slot]))]:pe-14";

export function DialogContent({
  className,
  children,
  size = "md",
  closeLabel,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  size?: DialogSize;
  /** Accessible name of the close button; defaults to `common.close`. */
  closeLabel?: string;
}) {
  const t = useT();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(0_30_48/0.42)] motion-safe:animate-[dialog-fade_160ms_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground",
          "max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(88dvh,56rem)]",
          "shadow-[0_24px_48px_-16px_rgb(0_78_119/0.28),0_2px_8px_rgb(0_78_119/0.08)]",
          "motion-safe:animate-[dialog-in_200ms_cubic-bezier(0.25,1,0.5,1)]",
          LEGACY_LAYOUT,
          DIALOG_SIZES[size],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute end-3 top-3.5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 sm:end-4 sm:top-5">
          <X className="h-4 w-4" aria-hidden />
          <span className="sr-only">{closeLabel ?? t("common.close")}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold leading-7 text-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("max-w-[65ch] text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}
