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
