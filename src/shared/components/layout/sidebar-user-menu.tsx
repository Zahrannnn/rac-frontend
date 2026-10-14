"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { routes } from "@/shared/constants/routes";
import { useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";

/** Sidebar footer user chip: initials avatar, name/username and logout. */
export function SidebarUserMenu() {
  const t = useT();
  const { user, logout } = useAuth();

  return (
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
  );
}
