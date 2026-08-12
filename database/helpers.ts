/** ISO date YYYY-MM-DD in local timezone */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Shift calendar day by delta (local) */
export function addDays(date: Date, delta: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + delta);
  return next;
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function boolToInt(value: boolean | undefined, fallback = false): number {
  return (value ?? fallback) ? 1 : 0;
}

export function intToBool(value: number | null | undefined): boolean {
  return (value ?? 0) === 1;
}
