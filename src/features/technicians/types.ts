export type TechnicianStatus = "Active" | "Inactive";

export type Technician = {
  id: string;
  fullName: string;
  fullNameAr: string | null;
  nationalId: string | null;
  mobile: string | null;
  /** Nullable — free technicians register without a workshop ("بدون ورشة"). */
  workshopId: string | null;
  workshopCode: string | null;
  specialty: string | null;
  yearsOfExperience: number;
  status: TechnicianStatus;
  notes: string | null;
  createdAtUtc: string;
};

export type TechnicianListFilters = {
  page: number;
  search?: string;
  workshopId?: string;
  status?: TechnicianStatus;
};
