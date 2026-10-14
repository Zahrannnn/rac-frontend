"use client";

import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useT } from "@/shared/i18n";
import { AppSidebar } from "./app-sidebar";

/**
 * Authenticated app shell: the sidebar (mirrored per locale), a sticky
 * toolbar and the centered content column.
 */
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
