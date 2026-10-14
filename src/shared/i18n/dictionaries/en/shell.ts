import type { shell as shellAr } from "../ar/shell";

// English dictionary — shell namespace. Compile-time locked to the ar key set:
// a missing or extra key here is a type error.
export const shell: Record<keyof typeof shellAr, string> = {
  "shell.themeLight": "Light mode",
  "shell.themeDark": "Dark mode",
  "shell.toggleSidebar": "Toggle sidebar",
  // Nav
  "nav.dashboard": "Dashboard",
  "nav.workshops": "Workshops — Car AC Service Centers",
  "nav.technicians": "Technicians",
  "nav.surveys": "Surveys",
  "nav.selection": "Selection",
  "nav.trainings": "Trainings",
  "nav.equipment": "Equipment",
  "nav.reports": "Reports",
  "nav.administration": "Administration",
};
