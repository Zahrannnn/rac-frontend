"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";
import { useAuth } from "../hooks/use-auth-session";
import { loginSchema, type LoginFieldErrors } from "../validations/login-schema";

type TFunc = ReturnType<typeof useT>;

type ValidationIssue = { path: readonly PropertyKey[]; message: string; code: string };

function loginFieldErrors(issues: readonly ValidationIssue[], t: TFunc): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const messages = new Map(issues.map((issue) => [issue.path[0], issue.message]));
  const tooLong = (field: string) =>
    issues.some((issue) => issue.path[0] === field && issue.code === "too_big");

  if (messages.has("usernameOrEmail")) {
    errors.usernameOrEmail = tooLong("usernameOrEmail")
      ? t("login.identifierTooLong")
      : t("login.usernameRequired");
  }
  if (messages.has("password")) {
    // The schema caps the identifier but not the password, so a password issue
    // here can only be too_small.
    errors.password = t("login.passwordTooShort");
  }
  return errors;
}

function loginFormError(error: unknown, t: TFunc): string {
  const { status, code } = error as { status?: number; code?: string };

  if (status === 401) {
    return t("login.invalidCredentials");
  }
  if (status === 429) {
    return t("login.rateLimited");
  }
  if (status === undefined || status >= 500 || code === "ECONNABORTED") {
    // No HTTP status / 5xx / timeout — the hosted backend is most likely
    // waking from idle; the credentials were never even judged.
    return t("login.serverUnreachable");
  }
  return t("login.failed");
}

/** The credential form; success lands on the dashboard via useAuth().login. */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const t = useT();
  const [usernameOrEmail, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ usernameOrEmail, password });

    if (!parsed.success) {
      setFieldErrors(loginFieldErrors(parsed.error.issues, t));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await login(parsed.data);
      toast.success(t("common.login"));
      router.push(routes.dashboard);
    } catch (error) {
      setFormError(loginFormError(error, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">{t("login.username")}</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={usernameOrEmail}
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={Boolean(fieldErrors.usernameOrEmail)}
          className="h-11 border-border bg-card"
          required
        />
        {fieldErrors.usernameOrEmail ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.usernameOrEmail}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("login.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            className="h-11 border-border bg-card pe-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="mt-1 h-11 w-full" disabled={submitting}>
        {submitting ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
