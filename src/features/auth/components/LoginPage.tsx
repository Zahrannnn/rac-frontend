"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/shared/components/brand/BrandLogo";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "../hooks/use-auth-session";
import { useResumeSessionRedirect } from "../hooks/use-resume-session-redirect";
import { AuthControls } from "./AuthControls";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  const { session } = useAuth();
  const t = useT();
  const { locale } = useI18n();
  useResumeSessionRedirect(session);

  if (session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#004e77] p-6">
        <Skeleton className="h-64 w-full max-w-sm rounded-md bg-white/10" />
      </main>
    );
  }

  const brandOnStart = locale === "ar";

  return (
    <main className="flex min-h-screen flex-col bg-[#004e77] lg:flex-row">
      <LoginBrandPanel className={brandOnStart ? "lg:order-2" : "lg:order-1"} />

      <section
        className={cn(
          "relative flex flex-1 items-center justify-center bg-background p-6 text-foreground sm:p-12",
          brandOnStart ? "lg:order-1" : "lg:order-2"
        )}
      >
        <AuthControls
          tone="surface"
          className="absolute end-5 top-5 hidden items-center gap-0.5 lg:flex"
        />

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandLogo size={13} withWordmark={false} />
            <span className="text-sm font-semibold text-foreground">{t("app.name")}</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("login.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("login.subtitle")}</p>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
