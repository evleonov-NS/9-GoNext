import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Place, TripIdea, TripIdeaInput } from '@/types';
import { getAllPlaces } from '@/repositories/placesRepository';
import {
  createTripIdea,
  deleteTripIdea,
  getAllTripIdeas,
  getTripIdeaPlaceCounts,
  updateTripIdea,
} from '@/repositories/tripIdeasRepository';
import { errorMessage } from '@/utils/errors';

export function useTripIdeas(): {
  ideas: TripIdea[];
  placeCounts: Map<number, number>;
  visitLaterPlaces: Place[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: TripIdeaInput) => Promise<TripIdea>;
  update: (id: number, input: Partial<TripIdeaInput>) => Promise<TripIdea>;
  remove: (id: number) => Promise<void>;
} {
  const db = useSQLiteContext();
  const [ideas, setIdeas] = useState<TripIdea[]>([]);
  const [placeCounts, setPlaceCounts] = useState<Map<number, number>>(new Map());
  const [visitLaterPlaces, setVisitLaterPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, counts, places] = await Promise.all([
        getAllTripIdeas(db),
        getTripIdeaPlaceCounts(db),
        getAllPlaces(db),
      ]);
      setIdeas(rows);
      setPlaceCounts(counts);
      setVisitLaterPlaces(places.filter((p) => p.visitLater));
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      console.error('[GoNext] trip ideas load failed', e);
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
    async (input: TripIdeaInput) => {
      const idea = await createTripIdea(db, input);
      await refresh();
      return idea;
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: number, input: Partial<TripIdeaInput>) => {
      const idea = await updateTripIdea(db, id, input);
      await refresh();
      return idea;
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteTripIdea(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return {
    ideas,
    placeCounts,
    visitLaterPlaces,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
