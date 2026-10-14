import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type SectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  /** Sits on the logical end of the heading row. */
  action?: ReactNode;
  /** 3 inside dialogs (below the dialog title), 2 for top-level page sections. */
  level?: 2 | 3;
  /** Gives the heading an id and names the section by it. */
  headingId?: string;
};

/** Titled content group; shared by dialog bodies and detail pages so both keep one rhythm. */
export function Section({
  title,
  action,
  level = 2,
  headingId,
  className,
  children,
  ...props
}: SectionProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section
      aria-labelledby={title && headingId ? headingId : undefined}
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {title || action ? (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          {title ? (
            <Heading id={headingId} className="text-sm font-semibold leading-6 text-foreground">
              {title}
            </Heading>
          ) : null}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
