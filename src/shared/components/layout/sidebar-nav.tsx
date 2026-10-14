"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { filterNavItems, navItems } from "@/shared/constants/nav";
import { useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";

/**
 * Main navigation: items filtered by the user's permissions, active state
 * derived from the pathname (exact match or child route).
 */
export function SidebarNav({ tooltipSide }: { tooltipSide: "left" | "right" }) {
  const pathname = usePathname();
  const t = useT();
  const { user } = useAuth();
  const visibleItems = filterNavItems(navItems, user?.permissions ?? []);

  return (
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
  );
}
