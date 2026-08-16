import type { TripPlaceStatus } from '@/types';

type RouteItem = { status: TripPlaceStatus; sortOrder: number };

/** Маршрут: порядок = sortOrder (день — свойство позиции). */
export function sortByRouteOrder<T extends { sortOrder: number }>(places: T[]): T[] {
  return [...places].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Первое pending в порядке маршрута. visited и skipped пропускаются. */
export function findNextPending<T extends RouteItem>(places: T[]): T | undefined {
  return sortByRouteOrder(places).find((p) => p.status === 'pending');
}

export function countByStatus<T extends { status: TripPlaceStatus }>(
  places: T[],
  status: TripPlaceStatus
): number {
  return places.filter((p) => p.status === status).length;
}
