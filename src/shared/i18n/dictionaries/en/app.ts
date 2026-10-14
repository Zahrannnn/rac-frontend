import type { app as appAr } from "../ar/app";

// English dictionary — app namespace. Compile-time locked to the ar key set:
// a missing or extra key here is a type error.
export const app: Record<keyof typeof appAr, string> = {
  // App / shell
  "app.name": "MAC-Egypt",
  "app.programTitle": "MAC Digital Assessment & Monitoring Platform",
  "app.programTitleShort": "Digital Assessment & Monitoring: MAC sector",
  "app.partners": "UNIDO · NOU · EED",
};
