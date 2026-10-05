import { Fragment } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/shared/utils/cn";

export type BreadcrumbEntry = {
  /** Visible label (already translated). */
  label: string;
  /** Destination for non-terminal crumbs; omit for the current page. */
  href?: Route;
};

type PageBreadcrumbsProps = {
  items: BreadcrumbEntry[];
  /** "inverted" = white-on-navy for dark console bands (admin surfaces). */
  tone?: "default" | "inverted";
  className?: string;
};

/**
 * App-standard breadcrumbs on the shadcn Breadcrumb primitive: earlier items
 * link through, the last renders as the current page, and the separator
 * chevron flips in RTL. Hidden entirely when there is nothing to show.
 */
export function PageBreadcrumbs({ items, tone = "default", className }: PageBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className={cn(tone === "inverted" && "text-white/70", className)}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className={tone === "inverted" ? "text-white" : undefined}>
                    {item.label}
                  </BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink
                    asChild
                    className={tone === "inverted" ? "text-white/70 hover:text-white" : undefined}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{item.label}</span>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator className="[&>svg]:rtl:rotate-180" /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
