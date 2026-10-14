import type { table as tableAr } from "../ar/table";

// English dictionary — table namespace. Compile-time locked to the ar key set:
// a missing or extra key here is a type error.
export const table: Record<keyof typeof tableAr, string> = {
  "table.emptyTitle": "No data",
  "table.previous": "Previous",
  "table.next": "Next",
};
