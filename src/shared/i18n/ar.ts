// Arabic dictionary — the default and source of truth for the key set.
// Namespace modules live in ./dictionaries/ar; this file merges them into the
// flat record the provider, tests, and the TranslationKey/Dictionary types consume.
import { app } from "./dictionaries/ar/app";
import { auth } from "./dictionaries/ar/auth";
import { shell } from "./dictionaries/ar/shell";
import { common } from "./dictionaries/ar/common";
import { table } from "./dictionaries/ar/table";
import { workshops } from "./dictionaries/ar/workshops";
import { surveys } from "./dictionaries/ar/surveys";
import { technicians } from "./dictionaries/ar/technicians";
import { trainings } from "./dictionaries/ar/trainings";
import { equipment } from "./dictionaries/ar/equipment";
import { selection } from "./dictionaries/ar/selection";
import { reports } from "./dictionaries/ar/reports";
import { admin } from "./dictionaries/ar/admin";
import { dashboard } from "./dictionaries/ar/dashboard";
import { profile } from "./dictionaries/ar/profile";

export const ar = {
  ...app,
  ...auth,
  ...shell,
  ...common,
  ...table,
  ...workshops,
  ...surveys,
  ...technicians,
  ...trainings,
  ...equipment,
  ...selection,
  ...reports,
  ...admin,
  ...dashboard,
  ...profile,
} as const;

export type TranslationKey = keyof typeof ar;
export type Dictionary = Record<TranslationKey, string>;
