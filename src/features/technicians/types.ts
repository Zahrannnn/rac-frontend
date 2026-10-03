export type TechnicianStatus = "Active" | "Inactive";

export type Technician = {
  id: string;
  fullName: string;
  fullNameAr: string | null;
  nationalId: string;
  mobile: string;
  workshopId: string;
  workshopCode: string;
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
