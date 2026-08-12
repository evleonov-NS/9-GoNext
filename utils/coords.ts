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
