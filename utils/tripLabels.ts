import i18n from '@/i18n';
import type { TripPlaceStatus, TripStatus } from '@/types';
import { formatTripDatesHuman } from '@/utils/tripDates';

export function tripStatusLabel(status: TripStatus): string {
  return i18n.t(`tripStatus.${status}`);
}

/** Бейдж в списке поездок (как в прототипе). */
export function tripListStatusLabel(status: TripStatus): string {
  return i18n.t(`tripListStatus.${status}`);
}

export function tripPlaceStatusLabel(status: TripPlaceStatus): string {
  return i18n.t(`tripPlaceStatus.${status}`);
}

export function formatTripDates(startDate: string | null, endDate: string | null): string {
  return formatTripDatesHuman(startDate, endDate);
}

export const TRIP_COVER_PALETTE: [string, string][] = [
  ['#2f6d58', '#7fb59a'],
  ['#41567f', '#9fb2cf'],
  ['#8b5a2b', '#d9ab7c'],
  ['#5d4a80', '#b3a4cf'],
  ['#3f6157', '#a3bdb4'],
  ['#6b4e3d', '#c4a882'],
];

export function tripCoverForId(id: number): [string, string] {
  return TRIP_COVER_PALETTE[Math.abs(id) % TRIP_COVER_PALETTE.length];
}
