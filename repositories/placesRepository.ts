import type { SQLiteDatabase } from 'expo-sqlite';
import type { Place, PlaceInput } from '@/types';
import { boolToInt, nowIso } from '@/database/helpers';
import { enableForeignKeys, mapPlace, type PlaceRow } from '@/database/mappers';

export async function getAllPlaces(db: SQLiteDatabase): Promise<Place[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<PlaceRow>(
    'SELECT * FROM places ORDER BY name COLLATE NOCASE ASC'
  );
  return rows.map(mapPlace);
}

export async function getPlaceById(db: SQLiteDatabase, id: number): Promise<Place | null> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<PlaceRow>('SELECT * FROM places WHERE id = ?', id);
  return row ? mapPlace(row) : null;
}

export async function createPlace(db: SQLiteDatabase, input: PlaceInput): Promise<Place> {
  await enableForeignKeys(db);
  const ts = nowIso();
  const result = await db.runAsync(
    `INSERT INTO places (
      name, city, description, category, latitude, longitude,
      visit_later, liked, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.name,
    input.city ?? null,
    input.description ?? null,
    input.category,
    input.latitude ?? null,
    input.longitude ?? null,
    boolToInt(input.visitLater),
    boolToInt(input.liked),
    ts,
    ts
  );
  const place = await getPlaceById(db, result.lastInsertRowId);
  if (!place) {
    throw new Error('Не удалось создать место');
  }
  return place;
}

export async function updatePlace(
  db: SQLiteDatabase,
  id: number,
  input: Partial<PlaceInput>
): Promise<Place> {
  await enableForeignKeys(db);
  const current = await getPlaceById(db, id);
  if (!current) {
    throw new Error(`Место ${id} не найдено`);
  }

  const next = {
    name: input.name ?? current.name,
    city: input.city !== undefined ? input.city : current.city,
    description: input.description !== undefined ? input.description : current.description,
    category: input.category ?? current.category,
    latitude: input.latitude !== undefined ? input.latitude : current.latitude,
    longitude: input.longitude !== undefined ? input.longitude : current.longitude,
    visitLater: input.visitLater !== undefined ? input.visitLater : current.visitLater,
    liked: input.liked !== undefined ? input.liked : current.liked,
  };

  const ts = nowIso();
  await db.runAsync(
    `UPDATE places SET
      name = ?, city = ?, description = ?, category = ?,
      latitude = ?, longitude = ?, visit_later = ?, liked = ?, updated_at = ?
     WHERE id = ?`,
    next.name,
    next.city,
    next.description,
    next.category,
    next.latitude,
    next.longitude,
    boolToInt(next.visitLater),
    boolToInt(next.liked),
    ts,
    id
  );

  const place = await getPlaceById(db, id);
  if (!place) {
    throw new Error(`Место ${id} не найдено после обновления`);
  }
  return place;
}

export async function deletePlace(db: SQLiteDatabase, id: number): Promise<void> {
  await enableForeignKeys(db);
  await db.runAsync('DELETE FROM places WHERE id = ?', id);
}

export async function countPlaces(db: SQLiteDatabase): Promise<number> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM places');
  return row?.c ?? 0;
}
