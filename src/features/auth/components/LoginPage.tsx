"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Snowflake, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageToggle } from "@/shared/components/layout/language-toggle";
import { useI18n, useT } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";
import { refreshSession } from "../api/session-adapter";
import { useAuth } from "../hooks/use-auth-session";
import { LoginForm } from "./LoginForm";

const PARTNER_LOGOS = [
  { src: "/unido.webp", alt: "UNIDO", className: "h-8 w-auto sm:h-9" },
  { src: "/NOU.webp", alt: "NOU", className: "h-8 w-auto sm:h-9" },
  { src: "/eea.webp", alt: "EED", className: "h-10 w-auto sm:h-11" },
  { src: "/green.webp", alt: "Green Line", className: "h-7 w-auto sm:h-8" },
] as const;

function AuthThemeToggle({ tone = "shell" }: { tone?: "shell" | "surface" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  // next-themes resolves the theme only on the client; rendering the icon or
  // label from it during hydration mismatches the server HTML (React #418 —
  // the login page then never recovers past its loading fallback). Render a
  // stable shell until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  const isDark = mounted && resolvedTheme === "dark";
  const onShell = tone === "shell";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? t("shell.themeLight") : t("shell.themeDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        onShell
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

/** One static oversized snowflake — cool-air motif, no motion. */
function BrandSnowflake() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Snowflake
        className="absolute -end-16 top-1/2 size-[min(72vw,28rem)] -translate-y-1/2 text-white/[0.07] sm:size-[min(58vw,34rem)] lg:-end-24 lg:size-[38rem]"
        strokeWidth={0.75}
      />
    </div>
  );
}

function PartnerLogos() {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {PARTNER_LOGOS.map((logo) => (
        <li key={logo.src}>
          <Image
            src={logo.src}
            alt={logo.alt}
            width={140}
            height={48}
            className={`object-contain ${logo.className}`}
            priority
          />
        </li>
      ))}
    </ul>
  );
}

function AuthControls({
  className,
  tone = "shell",
}: {
  className?: string;
  tone?: "shell" | "surface";
}) {
  const onShell = tone === "shell";

  return (
    <div className={className}>
      <AuthThemeToggle tone={tone} />
      <div
        className={
          onShell
            ? "[&_button]:text-white/80 [&_button]:hover:bg-white/10 [&_button]:hover:text-white"
            : "[&_button]:text-muted-foreground [&_button]:hover:bg-muted [&_button]:hover:text-foreground"
        }
      >
        <LanguageToggle />
      </div>
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const t = useT();
  const { locale } = useI18n();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!session) {
      return;
    }
    // The cached session isn't proof the server cookie is alive — let the
    // API decide before bouncing an already-open login form back to the app.
    // refreshSession persists a new session object, which would re-run this
    // effect and cancel the very redirect it just requested — so the check
    // runs once per mount (checkedRef), not once per session identity.
    let cancelled = false;
    if (checkedRef.current) {
      return;
    }
    checkedRef.current = true;
    refreshSession().then((valid) => {
      if (!cancelled && valid) {
        router.replace(routes.dashboard);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router, session]);

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
      <section
        className={`relative flex flex-1 flex-col gap-10 overflow-hidden p-8 text-white sm:p-12 lg:min-h-screen lg:p-14 ${
          brandOnStart ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <BrandSnowflake />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/rac-damp-logo.png"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-lg shadow-sm ring-1 ring-white/20"
              priority
            />
            <p className="text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
              {t("app.partners")}
            </p>
          </div>
          <AuthControls className="flex items-center gap-0.5 lg:hidden" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center gap-4 py-10 lg:py-0">
          <p className="text-4xl font-bold tracking-tight sm:text-5xl">{t("app.name")}</p>
          <h1 className="max-w-lg text-lg font-medium leading-relaxed text-white/90 sm:text-xl">
            {t("app.programTitle")}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/55 sm:text-[0.9375rem]">
            {t("app.programTitleShort")}
          </p>
        </div>

        <footer className="relative z-10 mt-auto space-y-4 border-t border-white/10 pt-8">
          <PartnerLogos />
        </footer>
      </section>

      <section
        className={`relative flex flex-1 items-center justify-center bg-background p-6 text-foreground sm:p-12 ${
          brandOnStart ? "lg:order-1" : "lg:order-2"
        }`}
      >
        <AuthControls
          tone="surface"
          className="absolute end-5 top-5 hidden items-center gap-0.5 lg:flex"
        />

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image
              src="/brand/rac-damp-logo.png"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-md ring-1 ring-border"
              priority
            />
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
