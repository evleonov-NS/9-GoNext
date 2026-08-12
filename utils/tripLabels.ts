import type { TripStatus } from '@/types';

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

export function formatTripDates(startDate: string | null, endDate: string | null): string {
  if (startDate && endDate) return `${startDate} — ${endDate}`;
  if (startDate) return `с ${startDate}`;
  if (endDate) return `до ${endDate}`;
  return 'Даты не заданы';
}
