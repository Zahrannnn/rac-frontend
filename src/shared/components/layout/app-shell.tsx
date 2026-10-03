"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Languages, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { filterNavItems, navItems } from "@/shared/constants/nav";
import { routes } from "@/shared/constants/routes";
import { useI18n, useT, type Locale } from "@/shared/i18n";
import { useAuth } from "@/features/auth";
import { cn } from "@/shared/utils/cn";

function AppSidebar() {
  const pathname = usePathname();
  const t = useT();
  const { locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const visibleItems = filterNavItems(navItems, user?.permissions ?? []);
  const side = locale === "ar" ? "right" : "left";
  const tooltipSide = side === "right" ? "left" : "right";

  const languageOptions: { value: Locale; label: string }[] = [
    { value: "ar", label: t("common.arabic") },
    { value: "en", label: t("common.english") },
  ];

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
                <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                  RAC
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={{ children: t(item.labelKey), side: tooltipSide }}
                    >
                      <Link href={item.href as Route}>
                        <Icon />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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

          {/* Language — in-sidebar segmented control (no floating portal) */}
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

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground ring-1 ring-sidebar-border">
                    {(user?.fullName ?? user?.username ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium text-sidebar-foreground">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.username}
                    </span>
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="center"
                sideOffset={8}
                className="min-w-48 border-sidebar-border bg-sidebar text-sidebar-foreground"
              >
                <DropdownMenuItem
                  className="text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent"
                  onClick={() => {
                    logout();
                    window.location.assign(routes.login);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ms-1" aria-label={t("shell.toggleSidebar")} />
        </header>
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
