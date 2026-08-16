import i18n from '@/i18n';

/** Склонение «N место / места / мест» (и en: place / places). */
export function pluralPlaces(n: number): string {
  return i18n.t('plural.places', { count: n });
}

export function pluralIdeas(n: number): string {
  return i18n.t('plural.ideas', { count: n });
}

export function pluralTrips(n: number): string {
  return i18n.t('plural.trips', { count: n });
}
