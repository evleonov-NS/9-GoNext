import type { SQLiteDatabase } from 'expo-sqlite';
import type { TripIdea, TripIdeaInput, TripIdeaPlace, TripIdeaPlaceInput } from '@/types';
import { nowIso } from '@/database/helpers';
import {
  enableForeignKeys,
  mapTripIdea,
  mapTripIdeaPlace,
  type TripIdeaPlaceRow,
  type TripIdeaRow,
} from '@/database/mappers';

export async function getAllTripIdeas(db: SQLiteDatabase): Promise<TripIdea[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripIdeaRow>(
    'SELECT * FROM trip_ideas ORDER BY updated_at DESC'
  );
  return rows.map(mapTripIdea);
}

export async function getTripIdeaById(db: SQLiteDatabase, id: number): Promise<TripIdea | null> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<TripIdeaRow>('SELECT * FROM trip_ideas WHERE id = ?', id);
  return row ? mapTripIdea(row) : null;
}

export async function createTripIdea(db: SQLiteDatabase, input: TripIdeaInput): Promise<TripIdea> {
  await enableForeignKeys(db);
  const ts = nowIso();
  const result = await db.runAsync(
    `INSERT INTO trip_ideas (title, description, cover_photo, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.title,
    input.description ?? null,
    input.coverPhoto ?? null,
    input.status ?? 'active',
    ts,
    ts
  );
  const idea = await getTripIdeaById(db, result.lastInsertRowId);
  if (!idea) {
    throw new Error('Не удалось создать идею');
  }
  return idea;
}

export async function updateTripIdea(
  db: SQLiteDatabase,
  id: number,
  input: Partial<TripIdeaInput>
): Promise<TripIdea> {
  await enableForeignKeys(db);
  const current = await getTripIdeaById(db, id);
  if (!current) {
    throw new Error(`Идея ${id} не найдена`);
  }

  const next = {
    title: input.title ?? current.title,
    description: input.description !== undefined ? input.description : current.description,
    coverPhoto: input.coverPhoto !== undefined ? input.coverPhoto : current.coverPhoto,
    status: input.status ?? current.status,
  };

  const ts = nowIso();
  await db.runAsync(
    `UPDATE trip_ideas SET title = ?, description = ?, cover_photo = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    next.title,
    next.description,
    next.coverPhoto,
    next.status,
    ts,
    id
  );

  const idea = await getTripIdeaById(db, id);
  if (!idea) {
    throw new Error(`Идея ${id} не найдена после обновления`);
  }
  return idea;
}

export async function deleteTripIdea(db: SQLiteDatabase, id: number): Promise<void> {
  await enableForeignKeys(db);
  await db.runAsync('DELETE FROM trip_ideas WHERE id = ?', id);
}

export async function getTripIdeaPlaces(
  db: SQLiteDatabase,
  ideaId: number
): Promise<TripIdeaPlace[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places WHERE idea_id = ? ORDER BY sort_order ASC',
    ideaId
  );
  return rows.map(mapTripIdeaPlace);
}

export async function getAllTripIdeaPlaces(db: SQLiteDatabase): Promise<TripIdeaPlace[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places ORDER BY idea_id ASC, sort_order ASC'
  );
  return rows.map(mapTripIdeaPlace);
}

export async function addTripIdeaPlace(
  db: SQLiteDatabase,
  ideaId: number,
  input: TripIdeaPlaceInput
): Promise<TripIdeaPlace> {
  await enableForeignKeys(db);
  const ts = nowIso();
  const result = await db.runAsync(
    `INSERT INTO trip_idea_places (idea_id, place_id, sort_order, priority, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ideaId,
    input.placeId,
    input.sortOrder,
    input.priority ?? 'optional',
    input.notes ?? null,
    ts
  );
  const row = await db.getFirstAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places WHERE id = ?',
    result.lastInsertRowId
  );
  if (!row) {
    throw new Error('Не удалось добавить место в идею');
  }
  return mapTripIdeaPlace(row);
}

export async function updateTripIdeaPlace(
  db: SQLiteDatabase,
  id: number,
  input: Partial<Pick<TripIdeaPlaceInput, 'sortOrder' | 'priority' | 'notes'>>
): Promise<TripIdeaPlace> {
  await enableForeignKeys(db);
  const current = await db.getFirstAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places WHERE id = ?',
    id
  );
  if (!current) {
    throw new Error(`Связь идеи ${id} не найдена`);
  }

  await db.runAsync(
    `UPDATE trip_idea_places SET sort_order = ?, priority = ?, notes = ? WHERE id = ?`,
    input.sortOrder ?? current.sort_order,
    input.priority ?? current.priority,
    input.notes !== undefined ? input.notes : current.notes,
    id
  );

  const row = await db.getFirstAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places WHERE id = ?',
    id
  );
  if (!row) {
    throw new Error(`Связь идеи ${id} не найдена после обновления`);
  }
  return mapTripIdeaPlace(row);
}

export async function removeTripIdeaPlace(db: SQLiteDatabase, id: number): Promise<void> {
  await enableForeignKeys(db);
  await db.runAsync('DELETE FROM trip_idea_places WHERE id = ?', id);
}

export async function getTripIdeaPlaceCounts(
  db: SQLiteDatabase
): Promise<Map<number, number>> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<{ idea_id: number; c: number }>(
    `SELECT idea_id, COUNT(*) AS c FROM trip_idea_places GROUP BY idea_id`
  );
  return new Map(rows.map((r) => [r.idea_id, r.c]));
}

export async function getTripIdeaPlaceIds(
  db: SQLiteDatabase,
  ideaId: number
): Promise<Set<number>> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<{ place_id: number }>(
    'SELECT place_id FROM trip_idea_places WHERE idea_id = ?',
    ideaId
  );
  return new Set(rows.map((r) => r.place_id));
}

/** Добавить несколько мест; уже существующие пары idea+place пропускаются. */
export async function addTripIdeaPlacesBulk(
  db: SQLiteDatabase,
  ideaId: number,
  placeIds: number[],
  priority: TripIdeaPlaceInput['priority'] = 'optional'
): Promise<number> {
  if (placeIds.length === 0) return 0;
  await enableForeignKeys(db);

  const existing = await getTripIdeaPlaceIds(db, ideaId);
  const current = await getTripIdeaPlaces(db, ideaId);
  let nextOrder =
    current.length === 0 ? 0 : Math.max(...current.map((p) => p.sortOrder)) + 1;

  let added = 0;
  await db.withTransactionAsync(async () => {
    const ts = nowIso();
    for (const placeId of placeIds) {
      if (existing.has(placeId)) continue;
      await db.runAsync(
        `INSERT INTO trip_idea_places (idea_id, place_id, sort_order, priority, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ideaId,
        placeId,
        nextOrder,
        priority ?? 'optional',
        null,
        ts
      );
      nextOrder += 1;
      added += 1;
      existing.add(placeId);
    }
    if (added > 0) {
      await db.runAsync('UPDATE trip_ideas SET updated_at = ? WHERE id = ?', ts, ideaId);
    }
  });
  return added;
}

/** Поменять местами sort_order двух связей идеи. */
export async function swapTripIdeaPlaceOrder(
  db: SQLiteDatabase,
  aId: number,
  bId: number
): Promise<void> {
  await enableForeignKeys(db);
  const a = await db.getFirstAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places WHERE id = ?',
    aId
  );
  const b = await db.getFirstAsync<TripIdeaPlaceRow>(
    'SELECT * FROM trip_idea_places WHERE id = ?',
    bId
  );
  if (!a || !b) throw new Error('Место идеи не найдено');
  if (a.idea_id !== b.idea_id) throw new Error('Места из разных идей');

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE trip_idea_places SET sort_order = ? WHERE id = ?', b.sort_order, a.id);
    await db.runAsync('UPDATE trip_idea_places SET sort_order = ? WHERE id = ?', a.sort_order, b.id);
    await db.runAsync(
      'UPDATE trip_ideas SET updated_at = ? WHERE id = ?',
      nowIso(),
      a.idea_id
    );
  });
}
