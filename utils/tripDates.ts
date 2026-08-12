import { addDays, toDateOnly } from '@/database/helpers';

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

function parseDateOnly(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

function formatDayMonth(date: Date, withYear: boolean): string {
  const day = date.getDate();
  const mon = MONTHS_SHORT[date.getMonth()];
  if (withYear) return `${day} ${mon} ${date.getFullYear()}`;
  return `${day} ${mon}`;
}

/** Человекочитаемые даты поездки: «10–16 авг 2026», «даты не указаны». */
export function formatTripDatesHuman(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate && !endDate) return 'даты не указаны';
  const start = startDate ? parseDateOnly(startDate) : null;
  const end = endDate ? parseDateOnly(endDate) : null;
  if (start && end) {
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
    }
    if (sameYear) {
      return `${formatDayMonth(start, false)} – ${formatDayMonth(end, true)}`;
    }
    return `${formatDayMonth(start, true)} – ${formatDayMonth(end, true)}`;
  }
  if (start) return `с ${formatDayMonth(start, true)}`;
  if (end) return `до ${formatDayMonth(end, true)}`;
  return 'даты не указаны';
}

/** Число дней поездки включительно; null если дат нет. */
export function tripDurationDays(
  startDate: string | null,
  endDate: string | null
): number | null {
  if (!startDate || !endDate) return null;
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return null;
  return Math.floor(ms / 86_400_000) + 1;
}

/** Дата дня N (1-based) по startDate, или null. */
export function dateForTripDay(
  startDate: string | null,
  dayNumber: number
): string | null {
  if (!startDate || dayNumber < 1) return null;
  const start = parseDateOnly(startDate);
  if (!start) return null;
  return toDateOnly(addDays(start, dayNumber - 1));
}

export function todayDateOnly(): string {
  return toDateOnly(new Date());
}

/** Чипы дней: длительность по датам, иначе max(3, уже назначенные). */
export function tripDayChipNumbers(
  startDate: string | null,
  endDate: string | null,
  existingDayNumbers: (number | null)[]
): number[] {
  const duration = tripDurationDays(startDate, endDate);
  if (duration != null && duration > 0) {
    return Array.from({ length: duration }, (_, i) => i + 1);
  }
  const maxExisting = existingDayNumbers.reduce<number>((acc, d) => {
    if (d != null && d > acc) return d;
    return acc;
  }, 0);
  const n = Math.max(3, maxExisting);
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function isValidDateOnly(value: string): boolean {
  return parseDateOnly(value) != null;
}

/** Подпись одной даты: «2 окт 2026». */
export function formatSingleDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = parseDateOnly(iso);
  if (!date) return null;
  return formatDayMonth(date, true);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO → «12.04.26» для поля ввода. */
export function displayFromIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = parseDateOnly(iso);
  if (!date) return '';
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${pad2(
    date.getFullYear() % 100
  )}`;
}

/**
 * Маска ввода: только цифры → ДД.ММ.ГГ.
 * Точки из decimal-pad тоже принимаются (отбрасываются и ставятся сами).
 */
export function maskDateDisplayInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/** «12.04.26» / «12.04.2026» → ISO YYYY-MM-DD; иначе null. */
export function isoFromDisplay(display: string): string | null {
  const trimmed = display.trim();
  if (!trimmed) return null;

  let d: number;
  let mo: number;
  let y: number;

  const short = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(trimmed);
  const long = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (short) {
    d = Number(short[1]);
    mo = Number(short[2]);
    y = 2000 + Number(short[3]);
  } else if (long) {
    d = Number(long[1]);
    mo = Number(long[2]);
    y = Number(long[3]);
  } else {
    return null;
  }

  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return toDateOnly(date);
}

export function dateFromIso(iso: string | null | undefined): Date {
  return parseDateOnly(iso ?? '') ?? new Date();
}

export function isoFromDate(date: Date): string {
  return toDateOnly(date);
}
