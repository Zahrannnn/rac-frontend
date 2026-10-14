import type { auth as authAr } from "../ar/auth";

// English dictionary — auth namespace. Compile-time locked to the ar key set:
// a missing or extra key here is a type error.
export const auth: Record<keyof typeof authAr, string> = {
  "auth.partner.eedName": "Egyptian Company for Environmental Development",
  // Login
  "login.title": "Sign in",
  "login.subtitle": "Enter your credentials to continue",
  "login.username": "Username or email",
  "login.password": "Password",
  "login.showPassword": "Show password",
  "login.hidePassword": "Hide password",
  "login.submit": "Sign in",
  "login.submitting": "Signing in…",
  "login.invalidCredentials": "Invalid credentials",
  "login.rateLimited": "Too many sign-in attempts. Wait a minute and try again.",
  "login.passwordTooShort": "Password must be at least 8 characters",
  "login.identifierTooLong": "Username or email is too long",
  "login.failed": "Sign-in failed. Check your connection and try again.",
  "login.serverUnreachable":
    "The server is not responding right now — it is likely waking up. Wait a moment and try again.",
  "login.usernameRequired": "Username is required",
};
