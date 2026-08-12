import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Place, PlaceInput, Trip } from '@/types';
import {
  deletePlace,
  getPlaceById,
  updatePlace,
} from '@/repositories/placesRepository';
import { getTripsForPlace } from '@/repositories/tripsRepository';

export function usePlace(id: number | null): {
  place: Place | null;
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (input: Partial<PlaceInput>) => Promise<Place>;
  remove: () => Promise<void>;
} {
  const db = useSQLiteContext();
  const [place, setPlace] = useState<Place | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (id == null || !Number.isFinite(id)) {
      setPlace(null);
      setTrips([]);
      setLoading(false);
      setError('Некорректный id места');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [row, linked] = await Promise.all([getPlaceById(db, id), getTripsForPlace(db, id)]);
      setPlace(row);
      setTrips(linked);
      if (!row) setError('Место не найдено');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка чтения места';
      setError(message);
      console.error('[GoNext] place load failed', e);
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
    async (input: Partial<PlaceInput>) => {
      if (id == null) throw new Error('Нет id места');
      const next = await updatePlace(db, id, input);
      await refresh();
      return next;
    },
    [db, id, refresh]
  );

  const remove = useCallback(async () => {
    if (id == null) throw new Error('Нет id места');
    await deletePlace(db, id);
  }, [db, id]);

  return { place, trips, loading, error, refresh, update, remove };
}
