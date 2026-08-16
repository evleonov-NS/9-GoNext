import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Place, PlaceInput } from '@/types';
import {
  createPlace,
  deletePlace,
  getAllPlaces,
  getVisitedPlaceIds,
  updatePlace,
} from '@/repositories/placesRepository';
import { errorMessage } from '@/utils/errors';

export function usePlaces(): {
  places: Place[];
  visitedIds: Set<number>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: PlaceInput) => Promise<Place>;
  update: (id: number, input: Partial<PlaceInput>) => Promise<Place>;
  remove: (id: number) => Promise<void>;
} {
  const db = useSQLiteContext();
  const [places, setPlaces] = useState<Place[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, visited] = await Promise.all([getAllPlaces(db), getVisitedPlaceIds(db)]);
      setPlaces(rows);
      setVisitedIds(visited);
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      console.error('[GoNext] places load failed', e);
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
    async (input: PlaceInput) => {
      const place = await createPlace(db, input);
      await refresh();
      return place;
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: number, input: Partial<PlaceInput>) => {
      const place = await updatePlace(db, id, input);
      await refresh();
      return place;
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await deletePlace(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return { places, visitedIds, loading, error, refresh, create, update, remove };
}
