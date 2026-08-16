import type { SQLiteDatabase } from 'expo-sqlite';
import type { TripPlace } from '@/types';
import { toDateOnly } from '@/database/helpers';
import { updatePlace } from '@/repositories/placesRepository';
import { updateTripPlace } from '@/repositories/tripsRepository';

/** Посещено: status=visited, visitDate = сегодня. */
export async function markTripPlaceVisited(
  db: SQLiteDatabase,
  tripPlaceId: number
): Promise<TripPlace> {
  return updateTripPlace(db, tripPlaceId, {
    status: 'visited',
    visitDate: toDateOnly(new Date()),
  });
}

/** Пропуск: status=skipped. Очередь «следующего» идёт дальше. */
export async function skipTripPlace(
  db: SQLiteDatabase,
  tripPlaceId: number
): Promise<TripPlace> {
  return updateTripPlace(db, tripPlaceId, {
    status: 'skipped',
  });
}

/**
 * Мини-форма после посещения: заметка (если не пустая) и liked.
 * liked=true синхронизируется в Place.liked (PROJECT §11.3); обратной синхронизации нет.
 */
export async function saveVisitExtras(
  db: SQLiteDatabase,
  tripPlaceId: number,
  input: { notes?: string | null; liked?: boolean }
): Promise<TripPlace> {
  const patch: { notes?: string | null; liked?: boolean } = {};
  if (input.liked !== undefined) {
    patch.liked = input.liked;
  }
  if (input.notes !== undefined) {
    const trimmed = (input.notes ?? '').trim();
    if (trimmed) patch.notes = trimmed;
  }

  const updated = await updateTripPlace(db, tripPlaceId, patch);
  if (input.liked) {
    await updatePlace(db, updated.placeId, { liked: true });
  }
  return updated;
}
