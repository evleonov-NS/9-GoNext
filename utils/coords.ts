/** Широта, запятая, пробел, долгота — 6 знаков после точки (PROJECT §14.6). */
export function formatCoords(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function parseCoord(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function hasCoords(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  return latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
}

export function isValidLatitude(n: number): boolean {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

export function isValidLongitude(n: number): boolean {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

export type ParsedCoords = { latitude: number; longitude: number };

const DD = String.raw`([+-]?\d{1,3}[.,]\d+)`;

function toNumber(raw: string): number {
  return Number(raw.replace(',', '.'));
}

function asPair(latRaw: string, lngRaw: string): ParsedCoords | null {
  const latitude = toNumber(latRaw);
  const longitude = toNumber(lngRaw);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
  return { latitude, longitude };
}

function decodeClipboard(raw: string): string {
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

/**
 * Разбор пары координат из буфера: наш DD, geo:, Google, Яндекс ll=lng,lat.
 */
export function parseCoordsPair(raw: string): ParsedCoords | null {
  const text = decodeClipboard(raw);
  if (!text) return null;

  const yandexLl = text.match(new RegExp(`[?&#]ll=${DD}[,/]${DD}`, 'i'));
  if (yandexLl) {
    const parsed = asPair(yandexLl[2], yandexLl[1]);
    if (parsed) return parsed;
  }

  const geo = text.match(new RegExp(`geo:${DD},${DD}`, 'i'));
  if (geo) {
    const parsed = asPair(geo[1], geo[2]);
    if (parsed) return parsed;
  }

  const googleAt = text.match(new RegExp(`@${DD},${DD}`));
  if (googleAt) {
    const parsed = asPair(googleAt[1], googleAt[2]);
    if (parsed) return parsed;
  }

  const query = text.match(new RegExp(`[?&](?:q|query)=${DD}[,+]${DD}`, 'i'));
  if (query) {
    const parsed = asPair(query[1], query[2]);
    if (parsed) return parsed;
  }

  const nums = text.match(new RegExp(DD, 'g'));
  if (nums && nums.length >= 2) {
    return asPair(nums[0], nums[1]);
  }

  return null;
}
