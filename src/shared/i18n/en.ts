import type { Dictionary } from "./ar";
import { app } from "./dictionaries/en/app";
import { auth } from "./dictionaries/en/auth";
import { shell } from "./dictionaries/en/shell";
import { common } from "./dictionaries/en/common";
import { table } from "./dictionaries/en/table";
import { workshops } from "./dictionaries/en/workshops";
import { surveys } from "./dictionaries/en/surveys";
import { technicians } from "./dictionaries/en/technicians";
import { trainings } from "./dictionaries/en/trainings";
import { equipment } from "./dictionaries/en/equipment";
import { selection } from "./dictionaries/en/selection";
import { reports } from "./dictionaries/en/reports";
import { admin } from "./dictionaries/en/admin";
import { dashboard } from "./dictionaries/en/dashboard";
import { profile } from "./dictionaries/en/profile";

// English dictionary — merged from the ./dictionaries/en namespace modules.
// The Dictionary annotation keeps the merged key set locked to ar at compile
// time; each namespace module is additionally locked to its ar counterpart.
export const en: Dictionary = {
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
};
