"use client";

import { Languages } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useI18n, useT, type Locale } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";

/**
 * Footer language control: a plain toggle button in icon-collapsed mode
 * (no floating portal) and a segmented ar/en switch when expanded.
 */
export function SidebarLanguageControl({
  tooltipSide,
}: {
  tooltipSide: "left" | "right";
}) {
  const t = useT();
  const { locale, setLocale } = useI18n();

  const languageOptions: { value: Locale; label: string }[] = [
    { value: "ar", label: t("common.arabic") },
    { value: "en", label: t("common.english") },
  ];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={{ children: t("common.language"), side: tooltipSide }}
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        className="hidden group-data-[collapsible=icon]:flex"
      >
        <Languages />
        <span>{t("common.language")}</span>
      </SidebarMenuButton>

      <div className="flex flex-col gap-1.5 px-2 pb-0.5 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 px-1 text-xs font-medium text-sidebar-foreground/65">
          <Languages className="size-3.5 shrink-0" aria-hidden />
          <span>{t("common.language")}</span>
        </div>
        <div
          role="group"
          aria-label={t("common.language")}
          className="grid grid-cols-2 gap-1 rounded-lg bg-sidebar-accent/70 p-1 ring-1 ring-sidebar-border"
        >
          {languageOptions.map((option) => {
            const selected = locale === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setLocale(option.value)}
                aria-pressed={selected}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                  selected
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </SidebarMenuItem>
  );
}
