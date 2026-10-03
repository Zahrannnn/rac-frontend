"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DayPickerProps,
} from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

export type CalendarProps = DayPickerProps & {
  buttonVariant?: "ghost" | "outline" | "default" | "secondary" | "destructive";
};

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString("en-GB")}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "inline-flex size-[--cell-size] items-center justify-center rounded-md text-sm font-normal tabular-nums transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

/**
 * DayPicker renders a real HTML table. Do not put flex/grid on week rows —
 * that collapses cells (especially under Arabic RTL). Keep the grid LTR for
 * Western digits / week order even when the app shell is RTL.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <div dir="ltr" className="w-fit">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn(
          "group/calendar bg-background p-3 [--cell-size:2.25rem]",
          className
        )}
        captionLayout={captionLayout}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString("en", { month: "short" }),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit", defaultClassNames.root),
          months: cn(
            "relative flex flex-col gap-4 sm:flex-row sm:gap-6",
            defaultClassNames.months
          ),
          month: cn("flex w-fit flex-col gap-3", defaultClassNames.month),
          nav: cn(
            "absolute inset-x-0 top-0 flex w-full items-center justify-between",
            defaultClassNames.nav
          ),
          button_previous: cn(
            buttonVariants({ variant: buttonVariant, size: "icon" }),
            "size-[--cell-size] shrink-0 select-none p-0 aria-disabled:opacity-50",
            defaultClassNames.button_previous
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant, size: "icon" }),
            "size-[--cell-size] shrink-0 select-none p-0 aria-disabled:opacity-50",
            defaultClassNames.button_next
          ),
          month_caption: cn(
            "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
            defaultClassNames.month_caption
          ),
          caption_label: cn(
            "select-none text-sm font-semibold tabular-nums",
            defaultClassNames.caption_label
          ),
          // Table layout — fixed 7 equal columns
          month_grid: cn(
            "w-[calc(var(--cell-size)*7)] table-fixed border-collapse",
            defaultClassNames.month_grid
          ),
          weekdays: cn(defaultClassNames.weekdays),
          weekday: cn(
            "h-8 w-[--cell-size] p-0 text-center text-[0.75rem] font-medium text-muted-foreground",
            defaultClassNames.weekday
          ),
          week: cn(defaultClassNames.week),
          day: cn(
            "group/day relative h-[--cell-size] w-[--cell-size] p-0 text-center align-middle",
            defaultClassNames.day
          ),
          range_start: cn(
            "rounded-s-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
            defaultClassNames.range_start
          ),
          range_middle: cn(
            "bg-accent [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-accent-foreground",
            defaultClassNames.range_middle
          ),
          range_end: cn(
            "rounded-e-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
            defaultClassNames.range_end
          ),
          today: cn(
            "[&>button]:bg-accent [&>button]:text-accent-foreground",
            defaultClassNames.today
          ),
          outside: cn(
            "text-muted-foreground opacity-50",
            defaultClassNames.outside
          ),
          disabled: cn(
            "text-muted-foreground opacity-40",
            defaultClassNames.disabled
          ),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Chevron: ({ className: chevronClass, orientation, ...chevronProps }) => {
            if (orientation === "left") {
              return <ChevronLeft className={cn("size-4", chevronClass)} {...chevronProps} />;
            }
            return <ChevronRight className={cn("size-4", chevronClass)} {...chevronProps} />;
          },
          DayButton: CalendarDayButton,
          ...components,
        }}
        {...props}
      />
    </div>
  );
}

export { CalendarDayButton };
