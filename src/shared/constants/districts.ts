import type { Governorate } from "./egypt";

/**
 * Curated district/area lists per governorate — a UI affordance, NOT a server-side
 * contract: the backend keeps `district` as an optional ≤64-char free-text string
 * and "Other (not listed)" must never be blocked. Every value here stays ≤64 chars;
 * the stored/submitted value is the English string (same convention as governorates).
 * `DISTRICT_AR` mirrors `DISTRICTS` entry-for-entry (same order, same length —
 * enforced by districts.test.ts).
 */
export const DISTRICTS: Record<Governorate, readonly string[]> = {
  Alexandria: [
    "Montaza", "Miami", "Sidi Gaber", "Smouha", "Gleem", "San Stefano",
    "Mandara", "Agami", "Moharam Bek", "Borg El Arab",
  ],
  Aswan: ["Aswan City", "Kom Ombo", "Edfu", "Abu Simbel"],
  Asyut: ["Asyut City", "Abnub", "Dayrout", "El Qusiya"],
  Beheira: ["Damanhour", "Kafr El Dawar", "Rashid", "Edku", "Abu Hummus"],
  "Beni Suef": ["Beni Suef City", "New Beni Suef", "Wasta", "Nasser"],
  Cairo: [
    "Nasr City", "Maadi", "Heliopolis", "Downtown", "Zamalek", "Shorouk",
    "Rehab", "Madinaty", "New Cairo", "Garden City", "Mokattam", "Ain Shams",
    "Helwan",
  ],
  Dakahlia: ["Mansoura", "Talkha", "Mit Ghamr", "Belqas", "Aga"],
  Damietta: ["Damietta City", "New Damietta", "Ras El Bar", "Faraskour"],
  Faiyum: ["Faiyum City", "Tamiya", "Senuris", "Ibsheway"],
  Gharbia: ["Tanta", "El Mahalla", "Kafr El Zayat", "Zifta", "Basyoun"],
  Giza: [
    "Dokki", "Mohandessin", "Haram", "6th of October", "Sheikh Zayed",
    "Saft", "Imbaba", "Faisal", "Hadayek October", "Ard El Lewa", "Abu Rawash",
  ],
  Ismailia: ["Ismailia City", "Fayed", "Qantara West", "Abu Sultan"],
  "Kafr El Sheikh": ["Kafr El Sheikh City", "Desouk", "Baltim", "Hamoul"],
  Luxor: ["Luxor City", "Esna", "Armant", "Qurna"],
  Matrouh: ["Marsa Matrouh", "El Alamein", "Dabaa", "Siwa"],
  Minya: ["Minya City", "Mallawi", "Bani Mazar", "Samalut", "Maghagha"],
  Monufia: ["Shibin El Kom", "Sadat City", "Menouf", "Ashmoun", "Quesna"],
  "New Valley": ["Kharga", "Dakhla", "Farafra", "Baris"],
  "North Sinai": ["Arish", "Bir El Abd", "Sheikh Zuweid", "Rafah"],
  "Port Said": ["Port Fouad", "El Arab", "El Manakh", "El Dawahy"],
  Qalyubia: ["Banha", "Shubra El Kheima", "Khanka", "Qalyub", "Obour", "Kaha"],
  Qena: ["Qena City", "Nag Hammadi", "Qift", "Farshut"],
  "Red Sea": ["Hurghada", "Safaga", "Marsa Alam", "El Quseir"],
  Sharqia: [
    "Zagazig", "10th of Ramadan", "Belbeis", "Abu Hammad", "Faqous",
    "Diarb Negm",
  ],
  Sohag: ["Sohag City", "Akhmim", "Tahta", "Girga", "El Balyana"],
  "South Sinai": ["Sharm El Sheikh", "Dahab", "Nuweiba", "El Tor"],
  Suez: ["Suez City", "Arbaeen", "Ataka"],
};

/** Arabic labels — parallel to DISTRICTS (same governorates, same order). */
export const DISTRICT_AR: Record<Governorate, readonly string[]> = {
  Alexandria: [
    "المنتزه", "ميامي", "سيدي جابر", "سموحة", "جليم", "سان استيفانو",
    "المندرة", "العجمي", "محرم بك", "برج العرب",
  ],
  Aswan: ["مدينة أسوان", "كوم أمبو", "إدفو", "أبو سمبل"],
  Asyut: ["مدينة أسيوط", "أبنوب", "ديروط", "القوصية"],
  Beheira: ["دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو حمص"],
  "Beni Suef": ["مدينة بني سويف", "بني سويف الجديدة", "الواسطى", "ناصر"],
  Cairo: [
    "مدينة نصر", "المعادي", "مصر الجديدة", "وسط البلد", "الزمالك", "الشروق",
    "الرحاب", "مدينتي", "القاهرة الجديدة", "جاردن سيتي", "المقطم", "عين شمس",
    "حلوان",
  ],
  Dakahlia: ["المنصورة", "طلخا", "ميت غمر", "بلقاس", "أجا"],
  Damietta: ["مدينة دمياط", "دمياط الجديدة", "رأس البر", "فارسكور"],
  Faiyum: ["مدينة الفيوم", "طامية", "سنورس", "إبشواي"],
  Gharbia: ["طنطا", "المحلة", "كفر الزيات", "زفتى", "بسيون"],
  Giza: [
    "الدقي", "المهندسين", "الهرم", "6 أكتوبر", "الشيخ زايد",
    "سفت", "إمبابة", "فيصل", "حدائق أكتوبر", "عرض الليوة", "أبو رواش",
  ],
  Ismailia: ["مدينة الإسماعيلية", "فايد", "القنطرة غرب", "أبو سلطان"],
  "Kafr El Sheikh": ["مدينة كفر الشيخ", "دسوق", "بلتيم", "حمول"],
  Luxor: ["مدينة الأقصر", "إسنا", "أرمنت", "القرنة"],
  Matrouh: ["مرسى مطروح", "العلمين", "الضبعة", "سيوة"],
  Minya: ["مدينة المنيا", "ملوي", "بني مزار", "سمالوط", "مغاغة"],
  Monufia: ["شبين الكوم", "مدينة السادات", "منوف", "أشمون", "قويسنا"],
  "New Valley": ["الخارجة", "الداخلة", "الفرافرة", "باريس"],
  "North Sinai": ["العريش", "بئر العبد", "الشيخ زويد", "رفح"],
  "Port Said": ["بورفؤاد", "العرب", "المناخ", "الضواحي"],
  Qalyubia: ["بنها", "شبرا الخيمة", "الخانكة", "قليوب", "العبور", "كها"],
  Qena: ["مدينة قنا", "نجع حمادي", "قفط", "فرشوط"],
  "Red Sea": ["الغردقة", "سفاجا", "مرسى علم", "القصير"],
  Sharqia: [
    "الزقازيق", "10 رمضان", "بلبيس", "أبو حماد", "فاقوس",
    "ديرب نجم",
  ],
  Sohag: ["مدينة سوهاج", "أخميم", "طهطا", "جرجا", "البلينا"],
  "South Sinai": ["شرم الشيخ", "دهب", "نويبع", "الطور"],
  Suez: ["مدينة السويس", "الأربعين", "عتاقة"],
};

/**
 * Escape-hatch sentinel — never submitted. Selecting it reveals the required
 * manual-entry field whose trimmed text is what gets sent as `district`.
 */
export const OTHER_DISTRICT = "__OTHER__";

/** District options for a governorate; empty when none is selected. */
export function districtsFor(governorate: string): readonly string[] {
  return DISTRICTS[governorate as Governorate] ?? [];
}

/** True when the value is one of the governorate's curated districts. */
export function isListedDistrict(governorate: string, district: string): boolean {
  return districtsFor(governorate).includes(district);
}

/** Display label — Arabic in the ar locale, English (the stored value) otherwise. */
export function districtLabel(
  governorate: string,
  district: string,
  locale: string
): string {
  if (locale !== "ar") {
    return district;
  }
  const list = districtsFor(governorate);
  const index = list.indexOf(district);
  return index === -1 ? district : DISTRICT_AR[governorate as Governorate][index];
}
