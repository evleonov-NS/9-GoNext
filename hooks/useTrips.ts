import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Trip, TripInput } from '@/types';
import {
  createTrip,
  deleteTrip,
  getAllTrips,
  getTripPlaceCounts,
  updateTrip,
} from '@/repositories/tripsRepository';

export function useTrips(): {
  trips: Trip[];
  placeCounts: Map<number, number>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: TripInput) => Promise<Trip>;
  update: (id: number, input: Partial<TripInput>) => Promise<Trip>;
  remove: (id: number) => Promise<void>;
} {
  const db = useSQLiteContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [placeCounts, setPlaceCounts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, counts] = await Promise.all([
        getAllTrips(db),
        getTripPlaceCounts(db),
      ]);
      setTrips(rows);
      setPlaceCounts(counts);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка чтения поездок';
      setError(message);
      console.error('[GoNext] trips load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const create = useCallback(
    async (input: TripInput) => {
      const trip = await createTrip(db, input);
      await refresh();
      return trip;
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: number, input: Partial<TripInput>) => {
      const trip = await updateTrip(db, id, input);
      await refresh();
      return trip;
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteTrip(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return {
    trips,
    placeCounts,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
