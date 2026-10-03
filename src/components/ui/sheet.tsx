"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 gap-4 bg-popover text-popover-foreground shadow-lg transition ease-in-out",
          side === "left" && "inset-y-0 left-0 h-full w-72 border-r",
          side === "right" && "inset-y-0 right-0 h-full w-72 border-l",
          side === "top" && "inset-x-0 top-0 border-b",
          side === "bottom" && "inset-x-0 bottom-0 border-t",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute end-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
