"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth";
import { AppQueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { WebVitals } from "@/shared/components/feedback/web-vitals";
import { I18nProvider } from "@/shared/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppQueryProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            {children}
            <WebVitals />
            <Toaster />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </AppQueryProvider>
  );
}
