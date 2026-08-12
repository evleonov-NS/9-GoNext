import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type {
  Place,
  PlacePriority,
  TripIdea,
  TripIdeaInput,
  TripIdeaPlace,
} from '@/types';
import { getPlaceById } from '@/repositories/placesRepository';
import {
  addTripIdeaPlacesBulk,
  getTripIdeaById,
  getTripIdeaPlaces,
  removeTripIdeaPlace,
  swapTripIdeaPlaceOrder,
  updateTripIdea,
  updateTripIdeaPlace,
} from '@/repositories/tripIdeasRepository';

export type IdeaPlaceRow = TripIdeaPlace & { place: Place };

export function useTripIdea(id: number | null): {
  idea: TripIdea | null;
  places: IdeaPlaceRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (input: Partial<TripIdeaInput>) => Promise<TripIdea>;
  addPlaces: (placeIds: number[]) => Promise<number>;
  updatePlace: (
    linkId: number,
    input: { priority?: PlacePriority; notes?: string | null; sortOrder?: number }
  ) => Promise<void>;
  movePlace: (linkId: number, direction: 'up' | 'down') => Promise<void>;
  removePlace: (linkId: number) => Promise<void>;
} {
  const db = useSQLiteContext();
  const [idea, setIdea] = useState<TripIdea | null>(null);
  const [places, setPlaces] = useState<IdeaPlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (id == null || !Number.isFinite(id)) {
      setIdea(null);
      setPlaces([]);
      setLoading(false);
      setError('Некорректный id идеи');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await getTripIdeaById(db, id);
      setIdea(row);
      if (!row) {
        setPlaces([]);
        setError('Идея не найдена');
        return;
      }
      const links = await getTripIdeaPlaces(db, id);
      const enriched: IdeaPlaceRow[] = [];
      for (const link of links) {
        const place = await getPlaceById(db, link.placeId);
        if (place) enriched.push({ ...link, place });
      }
      setPlaces(enriched);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка чтения идеи';
      setError(message);
      console.error('[GoNext] trip idea load failed', e);
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
    async (input: Partial<TripIdeaInput>) => {
      if (id == null) throw new Error('Нет id идеи');
      const next = await updateTripIdea(db, id, input);
      await refresh();
      return next;
    },
    [db, id, refresh]
  );

  const addPlaces = useCallback(
    async (placeIds: number[]) => {
      if (id == null) throw new Error('Нет id идеи');
      const n = await addTripIdeaPlacesBulk(db, id, placeIds);
      await refresh();
      return n;
    },
    [db, id, refresh]
  );

  const updatePlace = useCallback(
    async (
      linkId: number,
      input: { priority?: PlacePriority; notes?: string | null; sortOrder?: number }
    ) => {
      await updateTripIdeaPlace(db, linkId, input);
      await refresh();
    },
    [db, refresh]
  );

  const movePlace = useCallback(
    async (linkId: number, direction: 'up' | 'down') => {
      const index = places.findIndex((p) => p.id === linkId);
      if (index < 0) return;
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= places.length) return;
      await swapTripIdeaPlaceOrder(db, places[index].id, places[swapWith].id);
      await refresh();
    },
    [db, places, refresh]
  );

  const removePlace = useCallback(
    async (linkId: number) => {
      await removeTripIdeaPlace(db, linkId);
      await refresh();
    },
    [db, refresh]
  );

  return {
    idea,
    places,
    loading,
    error,
    refresh,
    update,
    addPlaces,
    updatePlace,
    movePlace,
    removePlace,
  };
}
