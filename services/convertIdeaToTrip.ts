import type { SQLiteDatabase } from 'expo-sqlite';
import type { Trip } from '@/types';
import { boolToInt, nowIso } from '@/database/helpers';
import { enableForeignKeys } from '@/database/mappers';
import { getTripIdeaById, getTripIdeaPlaces } from '@/repositories/tripIdeasRepository';
import { getTripById } from '@/repositories/tripsRepository';

export type ConvertIdeaInput = {
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

/**
 * Идея → поездка: новый Trip + TripPlace по местам идеи.
 * Place не копируется (только placeId). Приоритет и заметки переносятся.
 * Идея становится converted. Повторная конвертация разрешена — ещё один Trip.
 */
export async function convertIdeaToTrip(
  db: SQLiteDatabase,
  ideaId: number,
  input: ConvertIdeaInput
): Promise<Trip> {
  await enableForeignKeys(db);

  const idea = await getTripIdeaById(db, ideaId);
  if (!idea) {
    throw new Error('Идея не найдена');
  }

  const ideaPlaces = await getTripIdeaPlaces(db, ideaId);
  const holder: { tripId: number | null } = { tripId: null };
  const ts = nowIso();

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO trips (
        title, description, start_date, end_date, status, current, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      input.title,
      input.description ?? idea.description,
      input.startDate ?? null,
      input.endDate ?? null,
      'planned',
      boolToInt(false),
      ts,
      ts
    );
    const tripId = result.lastInsertRowId;
    holder.tripId = tripId;

    for (const link of ideaPlaces) {
      await db.runAsync(
        `INSERT INTO trip_places (
          trip_id, place_id, sort_order, day_number, status, visit_date,
          liked, notes, priority, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tripId,
        link.placeId,
        link.sortOrder,
        null,
        'pending',
        null,
        0,
        link.notes,
        link.priority,
        ts,
        ts
      );
    }

    if (idea.status !== 'converted') {
      await db.runAsync(
        `UPDATE trip_ideas SET status = ?, updated_at = ? WHERE id = ?`,
        'converted',
        ts,
        ideaId
      );
    }
  });

  if (holder.tripId == null) {
    throw new Error('Не удалось создать поездку из идеи');
  }
  const created = await getTripById(db, holder.tripId);
  if (!created) {
    throw new Error('Не удалось создать поездку из идеи');
  }
  return created;
}
