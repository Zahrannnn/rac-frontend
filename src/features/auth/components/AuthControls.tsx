"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/shared/components/layout/language-toggle";
import { useT } from "@/shared/i18n";

/** `shell`: on the navy brand panel; `surface`: on the light form panel. */
type AuthTone = "shell" | "surface";

function AuthThemeToggle({ tone }: { tone: AuthTone }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  // next-themes resolves the theme only on the client; rendering the icon or
  // label from it during hydration mismatches the server HTML (React #418),
  // and the login page then never recovers past its loading fallback. Render
  // a stable shell until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? t("shell.themeLight") : t("shell.themeDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        tone === "shell"
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

/** Theme and language toggles for the signed-out screens. */
export function AuthControls({
  className,
  tone = "shell",
}: {
  className?: string;
  tone?: AuthTone;
}) {
  return (
    <div className={className}>
      <AuthThemeToggle tone={tone} />
      <div
        className={
          tone === "shell"
            ? "[&_button]:text-white/80 [&_button]:hover:bg-white/10 [&_button]:hover:text-white"
            : "[&_button]:text-muted-foreground [&_button]:hover:bg-muted [&_button]:hover:text-foreground"
        }
      >
        <LanguageToggle />
      </div>
    </div>
  );
}
