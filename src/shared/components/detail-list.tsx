import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Label/value metadata grid: one column on phones, two from `sm` up. */
export function DetailList({ className, ...props }: HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      className={cn("grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2", className)}
      {...props}
    />
  );
}

export function DetailItem({
  label,
  children,
  wide,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  /** Span both columns (long text such as notes or descriptions). */
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", wide && "sm:col-span-2", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words leading-6 text-foreground">{children}</dd>
    </div>
  );
}
