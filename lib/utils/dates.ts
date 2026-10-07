const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function monthLabel(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function fmtDateStr(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function dayAndMonth(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return { day: d.getDate(), month: MONTHS_SHORT[d.getMonth()] };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Realtime payloads deliver timestamptz columns in Postgres's native
// "YYYY-MM-DD HH:MM:SS.ffffff+00" format, while PostgREST (regular queries)
// serializes them as proper ISO 8601 ("...T...+00:00"). Normalize both to
// something `Date` parses reliably everywhere.
function parseTimestamp(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(normalized);
}

export function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - parseTimestamp(iso).getTime());
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getMonthGrid(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: { iso: string | null; day: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ iso: null, day: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ iso, day });
  }
  return cells;
}

export function formatDateRange(start: string, end?: string | null) {
  if (!end || end === start) return fmtDateStr(start);
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${MONTHS_SHORT[a.getMonth()]} ${a.getDate()}\u2013${b.getDate()}`;
  }
  return `${fmtDateStr(start)} \u2013 ${fmtDateStr(end)}`;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const pad = (n: number) => String(n).padStart(2, "0");

// Older posters only have free text like "Sept 27" or "Oct 10–12". Read a real
// date out of that so they can be sorted and archived like newer ones. Text
// without a recognizable month and day (e.g. "TBA") yields no date.
export function inferDatesFromLabel(label: string, now = new Date()) {
  const m = label.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:\s*[\u2013\u2014-]\s*(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2}))?/);
  if (!m) return { start: null as string | null, end: null as string | null };
  const month = MONTH_INDEX[m[1].slice(0, 3).toLowerCase()];
  if (month === undefined) return { start: null, end: null };
  const year = now.getFullYear();
  const start = `${year}-${pad(month + 1)}-${pad(Number(m[2]))}`;
  let end: string | null = null;
  if (m[4]) {
    const endMonth = m[3] ? MONTH_INDEX[m[3].slice(0, 3).toLowerCase()] ?? month : month;
    const endYear = endMonth < month ? year + 1 : year;
    end = `${endYear}-${pad(endMonth + 1)}-${pad(Number(m[4]))}`;
  }
  return { start, end };
}
