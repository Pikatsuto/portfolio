const FR_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};

/** Convert French date string ("15 décembre 2025") to ISO format ("2025-12-15") */
export function frDateToISO(fr: string): string | null {
  const m = fr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = FR_MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}