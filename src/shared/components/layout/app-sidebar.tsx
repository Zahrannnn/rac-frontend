"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { routes } from "@/shared/constants/routes";
import { useI18n, useT } from "@/shared/i18n";
import { BrandLogo } from "@/shared/components/brand/BrandLogo";
import { SidebarLanguageControl } from "./sidebar-language-control";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUserMenu } from "./sidebar-user-menu";

/**
 * The app sidebar: brand header, permission-filtered navigation and the
 * footer controls (theme, language, user). Sits right in Arabic, left in
 * English — driven by `side`.
 */
export function AppSidebar() {
  const t = useT();
  const { locale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const side = locale === "ar" ? "right" : "left";
  const tooltipSide = side === "right" ? "left" : "right";

  return (
    <Sidebar collapsible="icon" side={side} variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={{ children: t("app.name"), side: tooltipSide }}
            >
              <Link href={routes.dashboard}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/10 ring-1 ring-sidebar-border">
                  <BrandLogo size={11} withWordmark={false} />
                </span>
                <span className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    {t("app.name")}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {t("app.programTitleShort")}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarNav tooltipSide={tooltipSide} />

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip={{
                children: isDark ? t("shell.themeLight") : t("shell.themeDark"),
                side: tooltipSide,
              }}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun /> : <Moon />}
              <span>{isDark ? t("shell.themeLight") : t("shell.themeDark")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarLanguageControl tooltipSide={tooltipSide} />

          <SidebarUserMenu />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
