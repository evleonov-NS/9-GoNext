import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { Place } from '@/types';
import { getAllPlaces } from '@/repositories/placesRepository';

/** Простая загрузка списка мест из SQLite (этап 2 — проверка слоя данных). */
export function usePlaces(): {
  places: Place[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const db = useSQLiteContext();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getAllPlaces(db);
      setPlaces(rows);
      console.log(`[GoNext] places via repository: ${rows.length}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка чтения places';
      setError(message);
      console.error('[GoNext] places load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { places, loading, error, refresh };
}
