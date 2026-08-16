import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type {
  Place,
  PlacePriority,
  Trip,
  TripInput,
  TripPlace,
  TripPlaceStatus,
} from '@/types';
import { getPlaceById } from '@/repositories/placesRepository';
import { toDateOnly } from '@/database/helpers';
import {
  addTripPlacesBulk,
  clearTripPlaceDaysBeyond,
  completeTrip,
  getActiveTrip,
  getTripById,
  getTripPlaces,
  reactivateTrip,
  removeTripPlace,
  startTrip,
  swapTripPlaceOrder,
  updateTrip,
  updateTripPlace,
} from '@/repositories/tripsRepository';
import { tripDurationDays } from '@/utils/tripDates';
import i18n from '@/i18n';
import { errorMessage } from '@/utils/errors';

export type TripPlaceRow = TripPlace & { place: Place };

export type StartTripResult =
  | { ok: true; trip: Trip }
  | { ok: false; reason: 'need_dates' }
  | { ok: false; reason: 'active_conflict'; activeTrip: Trip };

export function useTrip(id: number | null): {
  trip: Trip | null;
  places: TripPlaceRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (input: Partial<TripInput>) => Promise<{ trip: Trip; clearedDays: number }>;
  addPlaces: (placeIds: number[]) => Promise<number>;
  updatePlace: (
    linkId: number,
    input: {
      dayNumber?: number | null;
      priority?: PlacePriority;
      notes?: string | null;
      status?: TripPlaceStatus;
      visitDate?: string | null;
      liked?: boolean;
    }
  ) => Promise<void>;
  movePlace: (linkId: number, direction: 'up' | 'down') => Promise<void>;
  removePlace: (linkId: number) => Promise<void>;
  tryStart: (opts?: { completePrevious?: boolean }) => Promise<StartTripResult>;
  complete: () => Promise<Trip>;
  tryReactivate: (opts?: { completePrevious?: boolean }) => Promise<StartTripResult>;
  pendingCount: number;
  visitedCount: number;
} {
  const db = useSQLiteContext();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<TripPlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (id == null || !Number.isFinite(id)) {
      setTrip(null);
      setPlaces([]);
      setLoading(false);
      setError(i18n.t('alerts.tripNotFound'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await getTripById(db, id);
      setTrip(row);
      if (!row) {
        setPlaces([]);
        setError(i18n.t('alerts.tripNotFound'));
        return;
      }
      const links = await getTripPlaces(db, id);
      const enriched: TripPlaceRow[] = [];
      for (const link of links) {
        const place = await getPlaceById(db, link.placeId);
        if (place) enriched.push({ ...link, place });
      }
      // Маршрут по sort_order (день — свойство позиции)
      enriched.sort((a, b) => a.sortOrder - b.sortOrder);
      setPlaces(enriched);
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      console.error('[GoNext] trip load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const update = useCallback(
    async (input: Partial<TripInput>) => {
      if (id == null) throw new Error('Нет id поездки');
      const next = await updateTrip(db, id, input);
      let clearedDays = 0;
      const duration = tripDurationDays(next.startDate, next.endDate);
      if (duration != null) {
        clearedDays = await clearTripPlaceDaysBeyond(db, id, duration);
      }
      await refresh();
      return { trip: next, clearedDays };
    },
    [db, id, refresh]
  );

  const addPlaces = useCallback(
    async (placeIds: number[]) => {
      if (id == null) throw new Error('Нет id поездки');
      const n = await addTripPlacesBulk(db, id, placeIds);
      await refresh();
      return n;
    },
    [db, id, refresh]
  );

  const updatePlace = useCallback(
    async (
      linkId: number,
      input: {
        dayNumber?: number | null;
        priority?: PlacePriority;
        notes?: string | null;
        status?: TripPlaceStatus;
        visitDate?: string | null;
        liked?: boolean;
      }
    ) => {
      await updateTripPlace(db, linkId, input);
      await refresh();
    },
    [db, refresh]
  );

  const movePlace = useCallback(
    async (linkId: number, direction: 'up' | 'down') => {
      const ordered = [...places].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = ordered.findIndex((p) => p.id === linkId);
      if (index < 0) return;
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= ordered.length) return;
      await swapTripPlaceOrder(db, ordered[index].id, ordered[swapWith].id);
      await refresh();
    },
    [db, places, refresh]
  );

  const removePlace = useCallback(
    async (linkId: number) => {
      await removeTripPlace(db, linkId);
      await refresh();
    },
    [db, refresh]
  );

  const tryStart = useCallback(
    async (opts?: { completePrevious?: boolean }): Promise<StartTripResult> => {
      if (id == null) throw new Error('Нет id поездки');
      const current = await getTripById(db, id);
      if (!current) throw new Error('Поездка не найдена');
      if (!current.startDate || !current.endDate) {
        return { ok: false, reason: 'need_dates' };
      }
      try {
        const next = await startTrip(db, id, {
          completePrevious: opts?.completePrevious,
        });
        await refresh();
        return { ok: true, trip: next };
      } catch (e) {
        if (e instanceof Error && e.message === 'ACTIVE_CONFLICT') {
          const activeTrip = (e as Error & { activeTrip: Trip }).activeTrip;
          return { ok: false, reason: 'active_conflict', activeTrip };
        }
        throw e;
      }
    },
    [db, id, refresh]
  );

  const complete = useCallback(async () => {
    if (id == null) throw new Error('Нет id поездки');
    const next = await completeTrip(db, id);
    await refresh();
    return next;
  }, [db, id, refresh]);

  const tryReactivate = useCallback(
    async (opts?: { completePrevious?: boolean }): Promise<StartTripResult> => {
      if (id == null) throw new Error('Нет id поездки');
      try {
        if (opts?.completePrevious) {
          const active = await getActiveTrip(db);
          if (active && active.id !== id) {
            await completeTrip(db, active.id);
          }
        }
        const next = await reactivateTrip(db, id);
        await refresh();
        return { ok: true, trip: next };
      } catch (e) {
        if (e instanceof Error && e.message === 'ACTIVE_CONFLICT') {
          const activeTrip = (e as Error & { activeTrip: Trip }).activeTrip;
          return { ok: false, reason: 'active_conflict', activeTrip };
        }
        throw e;
      }
    },
    [db, id, refresh]
  );

  const pendingCount = places.filter((p) => p.status === 'pending').length;
  const visitedCount = places.filter((p) => p.status === 'visited').length;

  return {
    trip,
    places,
    loading,
    error,
    refresh,
    update,
    addPlaces,
    updatePlace,
    movePlace,
    removePlace,
    tryStart,
    complete,
    tryReactivate,
    pendingCount,
    visitedCount,
  };
}

export function markVisitedToday(): string {
  return toDateOnly(new Date());
}
