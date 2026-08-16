import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Trip } from '@/types';
import { toDateOnly } from '@/database/helpers';
import { getPlaceById } from '@/repositories/placesRepository';
import {
  completeTrip,
  getActiveTrip,
  getTripPlaces,
} from '@/repositories/tripsRepository';
import {
  markTripPlaceVisited,
  saveVisitExtras,
  skipTripPlace,
} from '@/services/visitPlace';
import type { TripPlaceRow } from '@/hooks/useTrip';
import {
  countByStatus,
  findNextPending,
  sortByRouteOrder,
} from '@/utils/nextPlace';

export type NextPlaceState = {
  trip: Trip | null;
  next: TripPlaceRow | null;
  pendingCount: number;
  visitedCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  markVisited: (tripPlaceId: number) => Promise<TripPlaceRow | null>;
  skip: (tripPlaceId: number) => Promise<void>;
  saveVisit: (
    tripPlaceId: number,
    input: { notes?: string | null; liked?: boolean }
  ) => Promise<void>;
  complete: () => Promise<Trip>;
};

export function useNextPlace(): NextPlaceState {
  const db = useSQLiteContext();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [rows, setRows] = useState<TripPlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const active = await getActiveTrip(db);
      setTrip(active);
      if (!active) {
        setRows([]);
        return;
      }
      const links = sortByRouteOrder(await getTripPlaces(db, active.id));
      const enriched: TripPlaceRow[] = [];
      for (const link of links) {
        const place = await getPlaceById(db, link.placeId);
        if (place) enriched.push({ ...link, place });
      }
      setRows(enriched);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка экрана следующего места';
      setError(message);
      console.error('[GoNext] next place load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const markVisited = useCallback(
    async (tripPlaceId: number): Promise<TripPlaceRow | null> => {
      const current = rows.find((r) => r.id === tripPlaceId) ?? null;
      await markTripPlaceVisited(db, tripPlaceId);
      await refresh({ silent: true });
      if (!current) return null;
      return {
        ...current,
        status: 'visited',
        visitDate: toDateOnly(new Date()),
      };
    },
    [db, refresh, rows]
  );

  const skip = useCallback(
    async (tripPlaceId: number) => {
      await skipTripPlace(db, tripPlaceId);
      await refresh({ silent: true });
    },
    [db, refresh]
  );

  const saveVisit = useCallback(
    async (
      tripPlaceId: number,
      input: { notes?: string | null; liked?: boolean }
    ) => {
      await saveVisitExtras(db, tripPlaceId, input);
      await refresh({ silent: true });
    },
    [db, refresh]
  );

  const complete = useCallback(async () => {
    if (!trip) throw new Error('Нет активной поездки');
    const nextTrip = await completeTrip(db, trip.id);
    await refresh({ silent: true });
    return nextTrip;
  }, [db, trip, refresh]);

  return {
    trip,
    next: findNextPending(rows) ?? null,
    pendingCount: countByStatus(rows, 'pending'),
    visitedCount: countByStatus(rows, 'visited'),
    totalCount: rows.length,
    loading,
    error,
    refresh,
    markVisited,
    skip,
    saveVisit,
    complete,
  };
}
