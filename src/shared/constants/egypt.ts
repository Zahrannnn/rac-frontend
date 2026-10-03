// Egypt's 27 governorates — values must match the backend reference data
// (rac-backend Domain/Governorates.cs), which validates the submitted string.
export const GOVERNORATES = [
  "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia",
  "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh",
  "Luxor", "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai",
  "Port Said", "Qalyubia", "Qena", "Red Sea", "Sharqia", "Sohag",
  "South Sinai", "Suez",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

/** Arabic labels for UI display; the stored/submitted value stays English. */
export const GOVERNORATE_AR: Record<Governorate, string> = {
  Alexandria: "الإسكندرية",
  Aswan: "أسوان",
  Asyut: "أسيوط",
  Beheira: "البحيرة",
  "Beni Suef": "بني سويف",
  Cairo: "القاهرة",
  Dakahlia: "الدقهلية",
  Damietta: "دمياط",
  Faiyum: "الفيوم",
  Gharbia: "الغربية",
  Giza: "الجيزة",
  Ismailia: "الإسماعيلية",
  "Kafr El Sheikh": "كفر الشيخ",
  Luxor: "الأقصر",
  Matrouh: "مطروح",
  Minya: "المنيا",
  Monufia: "المنوفية",
  "New Valley": "الوادي الجديد",
  "North Sinai": "شمال سيناء",
  "Port Said": "بورسعيد",
  Qalyubia: "القليوبية",
  Qena: "قنا",
  "Red Sea": "البحر الأحمر",
  Sharqia: "الشرقية",
  Sohag: "سوهاج",
  "South Sinai": "جنوب سيناء",
  Suez: "السويس",
};

/** Display label for a stored governorate — Arabic in the ar locale, English otherwise. */
export function governorateLabel(governorate: string, locale: string): string {
  if (locale !== "ar") {
    return governorate;
  }

  return GOVERNORATE_AR[governorate as Governorate] ?? governorate;
}
