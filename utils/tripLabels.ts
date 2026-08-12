import type { TripPlaceStatus, TripStatus } from '@/types';
import { formatTripDatesHuman } from '@/utils/tripDates';

export function tripStatusLabel(status: TripStatus): string {
  switch (status) {
    case 'active':
      return 'Текущая';
    case 'planned':
      return 'План';
    case 'completed':
      return 'Завершена';
    default:
      return status;
  }
}

/** Бейдж в списке поездок (как в прототипе). */
export function tripListStatusLabel(status: TripStatus): string {
  switch (status) {
    case 'active':
      return 'АКТИВНАЯ';
    case 'planned':
      return 'ПЛАН';
    case 'completed':
      return 'ДНЕВНИК';
    default: {
      const _exhaustive: never = status;
      return String(_exhaustive);
    }
  }
}

export function tripPlaceStatusLabel(status: TripPlaceStatus): string {
  switch (status) {
    case 'pending':
      return 'Не посещено';
    case 'visited':
      return 'Посещено';
    case 'skipped':
      return 'Пропущено';
    default:
      return status;
  }
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
