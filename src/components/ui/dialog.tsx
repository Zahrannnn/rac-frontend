"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,56rem)] w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-popover p-5 text-popover-foreground shadow-lg",
          className
        )}
        {...props}
      >
        <div className="min-h-0 flex-1 overflow-y-auto pe-1">{children}</div>
        <DialogPrimitive.Close className="absolute end-4 top-4 z-10 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
