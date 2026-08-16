import type { SQLiteDatabase } from 'expo-sqlite';
import type { Trip, TripInput, TripPlace, TripPlaceInput } from '@/types';
import { boolToInt, nowIso } from '@/database/helpers';
import {
  enableForeignKeys,
  mapTrip,
  mapTripPlace,
  type TripPlaceRow,
  type TripRow,
} from '@/database/mappers';

export async function getAllTrips(db: SQLiteDatabase): Promise<Trip[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripRow>(
    `SELECT * FROM trips
     ORDER BY
       CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
       start_date IS NULL, start_date DESC`
  );
  return rows.map(mapTrip);
}

export async function getTripById(db: SQLiteDatabase, id: number): Promise<Trip | null> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<TripRow>('SELECT * FROM trips WHERE id = ?', id);
  return row ? mapTrip(row) : null;
}

export async function createTrip(db: SQLiteDatabase, input: TripInput): Promise<Trip> {
  await enableForeignKeys(db);
  const ts = nowIso();
  const result = await db.runAsync(
    `INSERT INTO trips (
      title, description, start_date, end_date, status, current, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.title,
    input.description ?? null,
    input.startDate ?? null,
    input.endDate ?? null,
    input.status ?? 'planned',
    boolToInt(input.current),
    ts,
    ts
  );
  const trip = await getTripById(db, result.lastInsertRowId);
  if (!trip) {
    throw new Error('Не удалось создать поездку');
  }
  return trip;
}

export async function updateTrip(
  db: SQLiteDatabase,
  id: number,
  input: Partial<TripInput>
): Promise<Trip> {
  await enableForeignKeys(db);
  const current = await getTripById(db, id);
  if (!current) {
    throw new Error(`Поездка ${id} не найдена`);
  }

  const next = {
    title: input.title ?? current.title,
    description: input.description !== undefined ? input.description : current.description,
    startDate: input.startDate !== undefined ? input.startDate : current.startDate,
    endDate: input.endDate !== undefined ? input.endDate : current.endDate,
    status: input.status ?? current.status,
    current: input.current !== undefined ? input.current : current.current,
  };

  const ts = nowIso();
  await db.runAsync(
    `UPDATE trips SET
      title = ?, description = ?, start_date = ?, end_date = ?,
      status = ?, current = ?, updated_at = ?
     WHERE id = ?`,
    next.title,
    next.description,
    next.startDate,
    next.endDate,
    next.status,
    boolToInt(next.current),
    ts,
    id
  );

  const trip = await getTripById(db, id);
  if (!trip) {
    throw new Error(`Поездка ${id} не найдена после обновления`);
  }
  return trip;
}

export async function deleteTrip(db: SQLiteDatabase, id: number): Promise<void> {
  await enableForeignKeys(db);
  await db.runAsync('DELETE FROM trips WHERE id = ?', id);
}

export async function getTripPlaces(db: SQLiteDatabase, tripId: number): Promise<TripPlace[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripPlaceRow>(
    `SELECT * FROM trip_places
     WHERE trip_id = ?
     ORDER BY
       CASE WHEN day_number IS NULL THEN 1 ELSE 0 END,
       day_number ASC,
       sort_order ASC`,
    tripId
  );
  return rows.map(mapTripPlace);
}

export async function addTripPlace(
  db: SQLiteDatabase,
  tripId: number,
  input: TripPlaceInput
): Promise<TripPlace> {
  await enableForeignKeys(db);
  const ts = nowIso();
  const result = await db.runAsync(
    `INSERT INTO trip_places (
      trip_id, place_id, sort_order, day_number, status, visit_date,
      liked, notes, priority, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tripId,
    input.placeId,
    input.sortOrder,
    input.dayNumber ?? null,
    input.status ?? 'pending',
    input.visitDate ?? null,
    boolToInt(input.liked),
    input.notes ?? null,
    input.priority ?? 'optional',
    ts,
    ts
  );
  const row = await db.getFirstAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE id = ?',
    result.lastInsertRowId
  );
  if (!row) {
    throw new Error('Не удалось добавить место в поездку');
  }
  return mapTripPlace(row);
}

export async function updateTripPlace(
  db: SQLiteDatabase,
  id: number,
  input: Partial<Omit<TripPlaceInput, 'placeId'>>
): Promise<TripPlace> {
  await enableForeignKeys(db);
  const current = await db.getFirstAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE id = ?',
    id
  );
  if (!current) {
    throw new Error(`Место поездки ${id} не найдено`);
  }

  const ts = nowIso();
  await db.runAsync(
    `UPDATE trip_places SET
      sort_order = ?, day_number = ?, status = ?, visit_date = ?,
      liked = ?, notes = ?, priority = ?, updated_at = ?
     WHERE id = ?`,
    input.sortOrder ?? current.sort_order,
    input.dayNumber !== undefined ? input.dayNumber : current.day_number,
    input.status ?? current.status,
    input.visitDate !== undefined ? input.visitDate : current.visit_date,
    input.liked !== undefined ? boolToInt(input.liked) : current.liked,
    input.notes !== undefined ? input.notes : current.notes,
    input.priority ?? current.priority,
    ts,
    id
  );

  const row = await db.getFirstAsync<TripPlaceRow>('SELECT * FROM trip_places WHERE id = ?', id);
  if (!row) {
    throw new Error(`Место поездки ${id} не найдено после обновления`);
  }
  return mapTripPlace(row);
}

export async function removeTripPlace(db: SQLiteDatabase, id: number): Promise<void> {
  await enableForeignKeys(db);
  await db.runAsync('DELETE FROM trip_places WHERE id = ?', id);
}

export async function countTrips(db: SQLiteDatabase): Promise<number> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM trips');
  return row?.c ?? 0;
}

/** Поездки, в маршрут которых входит данное место. */
export async function getTripsForPlace(db: SQLiteDatabase, placeId: number): Promise<Trip[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripRow>(
    `SELECT t.* FROM trips t
     INNER JOIN trip_places tp ON tp.trip_id = t.id
     WHERE tp.place_id = ?
     ORDER BY
       CASE t.status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
       t.start_date IS NULL, t.start_date DESC`,
    placeId
  );
  return rows.map(mapTrip);
}

export async function getActiveTrip(db: SQLiteDatabase): Promise<Trip | null> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<TripRow>(
    `SELECT * FROM trips WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1`
  );
  return row ? mapTrip(row) : null;
}

/** Ближайшая planned-поездка: с датой раньше без даты, затем по start_date. */
export async function getNextPlannedTrip(db: SQLiteDatabase): Promise<Trip | null> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<TripRow>(
    `SELECT * FROM trips
     WHERE status = 'planned'
     ORDER BY start_date IS NULL, start_date ASC
     LIMIT 1`
  );
  return row ? mapTrip(row) : null;
}

/** Запланированные поездки с start_date = dateOnly (YYYY-MM-DD). */
export async function getPlannedTripsStartingOn(
  db: SQLiteDatabase,
  dateOnly: string
): Promise<Trip[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<TripRow>(
    `SELECT * FROM trips
     WHERE status = 'planned' AND start_date = ?
     ORDER BY title ASC`,
    dateOnly
  );
  return rows.map(mapTrip);
}

export async function getTripPlaceCounts(
  db: SQLiteDatabase
): Promise<Map<number, number>> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<{ trip_id: number; c: number }>(
    `SELECT trip_id, COUNT(*) AS c FROM trip_places GROUP BY trip_id`
  );
  return new Map(rows.map((r) => [r.trip_id, r.c]));
}

export async function getTripPlaceIds(
  db: SQLiteDatabase,
  tripId: number
): Promise<Set<number>> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<{ place_id: number }>(
    'SELECT place_id FROM trip_places WHERE trip_id = ?',
    tripId
  );
  return new Set(rows.map((r) => r.place_id));
}

/** Добавить места; уже есть в поездке — пропуск. status=pending, day=null, priority=optional. */
export async function addTripPlacesBulk(
  db: SQLiteDatabase,
  tripId: number,
  placeIds: number[]
): Promise<number> {
  if (placeIds.length === 0) return 0;
  await enableForeignKeys(db);

  const existing = await getTripPlaceIds(db, tripId);
  const current = await getTripPlaces(db, tripId);
  let nextOrder =
    current.length === 0 ? 0 : Math.max(...current.map((p) => p.sortOrder)) + 1;

  let added = 0;
  await db.withTransactionAsync(async () => {
    const ts = nowIso();
    for (const placeId of placeIds) {
      if (existing.has(placeId)) continue;
      await db.runAsync(
        `INSERT INTO trip_places (
          trip_id, place_id, sort_order, day_number, status, visit_date,
          liked, notes, priority, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tripId,
        placeId,
        nextOrder,
        null,
        'pending',
        null,
        0,
        null,
        'optional',
        ts,
        ts
      );
      nextOrder += 1;
      added += 1;
      existing.add(placeId);
    }
    if (added > 0) {
      await db.runAsync('UPDATE trips SET updated_at = ? WHERE id = ?', ts, tripId);
    }
  });
  return added;
}

/**
 * Поменять местами соседние позиции маршрута.
 * Меняются и sort_order, и dayNumber — день остаётся у позиции.
 */
export async function swapTripPlaceOrder(
  db: SQLiteDatabase,
  aId: number,
  bId: number
): Promise<void> {
  await enableForeignKeys(db);
  const a = await db.getFirstAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE id = ?',
    aId
  );
  const b = await db.getFirstAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE id = ?',
    bId
  );
  if (!a || !b) throw new Error('Место поездки не найдено');
  if (a.trip_id !== b.trip_id) throw new Error('Места из разных поездок');

  await db.withTransactionAsync(async () => {
    const ts = nowIso();
    await db.runAsync(
      `UPDATE trip_places SET sort_order = ?, day_number = ?, updated_at = ? WHERE id = ?`,
      b.sort_order,
      b.day_number,
      ts,
      a.id
    );
    await db.runAsync(
      `UPDATE trip_places SET sort_order = ?, day_number = ?, updated_at = ? WHERE id = ?`,
      a.sort_order,
      a.day_number,
      ts,
      b.id
    );
    await db.runAsync('UPDATE trips SET updated_at = ? WHERE id = ?', ts, a.trip_id);
  });
}

/** Сбросить day_number > maxDay в null; вернуть число затронутых. */
export async function clearTripPlaceDaysBeyond(
  db: SQLiteDatabase,
  tripId: number,
  maxDay: number
): Promise<number> {
  await enableForeignKeys(db);
  const result = await db.runAsync(
    `UPDATE trip_places
     SET day_number = NULL, updated_at = ?
     WHERE trip_id = ? AND day_number IS NOT NULL AND day_number > ?`,
    nowIso(),
    tripId,
    maxDay
  );
  return result.changes;
}

/**
 * Начать поездку: status=active, current=true.
 * Если есть другая active — завершает её (completePrevious=true) или бросает.
 */
export async function startTrip(
  db: SQLiteDatabase,
  tripId: number,
  options?: { completePrevious?: boolean }
): Promise<Trip> {
  await enableForeignKeys(db);
  const trip = await getTripById(db, tripId);
  if (!trip) throw new Error(`Поездка ${tripId} не найдена`);
  if (!trip.startDate || !trip.endDate) {
    throw new Error('Для старта нужны даты начала и окончания');
  }

  const active = await getActiveTrip(db);
  if (active && active.id !== tripId) {
    if (!options?.completePrevious) {
      const err = new Error('ACTIVE_CONFLICT') as Error & { activeTrip: Trip };
      err.activeTrip = active;
      throw err;
    }
    await updateTrip(db, active.id, { status: 'completed', current: false });
  }

  return updateTrip(db, tripId, { status: 'active', current: true });
}

export async function completeTrip(db: SQLiteDatabase, tripId: number): Promise<Trip> {
  return updateTrip(db, tripId, { status: 'completed', current: false });
}

export async function reactivateTrip(db: SQLiteDatabase, tripId: number): Promise<Trip> {
  await enableForeignKeys(db);
  const active = await getActiveTrip(db);
  if (active && active.id !== tripId) {
    const err = new Error('ACTIVE_CONFLICT') as Error & { activeTrip: Trip };
    err.activeTrip = active;
    throw err;
  }
  return updateTrip(db, tripId, { status: 'active', current: true });
}
