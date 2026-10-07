// Horarios de atención: lunes a sábado, 10:00-14:30 y 19:00-23:30
// Domingo cerrado

type TimeRange = { open: number; close: number }; // minutos desde medianoche

const RANGES: TimeRange[] = [
  { open: 10 * 60,       close: 14 * 60 + 30 }, // 10:00 - 14:30
  { open: 19 * 60,       close: 23 * 60 + 30 }, // 19:00 - 23:30
];

export function isStoreOpen(): boolean {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  const day = now.getDay(); // 0=domingo, 6=sábado
  if (day === 0) return false; // domingo cerrado

  const minutes = now.getHours() * 60 + now.getMinutes();
  return RANGES.some((r) => minutes >= r.open && minutes < r.close);
}

export const STORE_HOURS = "Lun a Sáb: 10:00 - 14:30 y 19:00 - 23:30";
