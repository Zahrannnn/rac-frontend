export type TechnicianStatus = "Active" | "Inactive";

export type Technician = {
  id: string;
  fullName: string;
  fullNameAr: string | null;
  mobile: string | null;
  /** Nullable — free technicians register without a workshop ("بدون ورشة"). */
  workshopId: string | null;
  workshopCode: string | null;
  specialty: string | null;
  yearsOfExperience: number;
  status: TechnicianStatus;
  notes: string | null;
  /** Registry attribute fields (REGISTRY-GAS-SPEC §1 + the 2026-11-17 NatID
   *  removal) — gender/age are manual data-entry now; employmentType is a
   *  camelCase role key. */
  gender: "male" | "female" | null;
  age: number | null;
  employmentType: "engineer" | "observer" | "technician" | "assistant" | null;
  /** نوع العمالة + خبرات الغازات الحديثة (REGISTRY-GAS-SPEC §11). */
  employmentNature: "permanent" | "temporary" | "selfEmployed" | "other" | null;
  hasModernRefrigerantExperience: boolean | null;
  employer: string | null;
  address: string | null;
  createdAtUtc: string;
};

export type TechnicianListFilters = {
  page: number;
  search?: string;
  workshopId?: string;
  status?: TechnicianStatus;
};
