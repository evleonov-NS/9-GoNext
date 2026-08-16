import type { SQLiteDatabase } from 'expo-sqlite';
import type { Photo, PhotoInput } from '@/types';
import { nowIso } from '@/database/helpers';
import { enableForeignKeys, mapPhoto, type PhotoRow } from '@/database/mappers';

export async function getPhotosByPlaceId(db: SQLiteDatabase, placeId: number): Promise<Photo[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photos WHERE place_id = ? ORDER BY created_at DESC',
    placeId
  );
  return rows.map(mapPhoto);
}

export async function getPhotoById(db: SQLiteDatabase, id: number): Promise<Photo | null> {
  await enableForeignKeys(db);
  const row = await db.getFirstAsync<PhotoRow>('SELECT * FROM photos WHERE id = ?', id);
  return row ? mapPhoto(row) : null;
}

export async function getAllPhotos(db: SQLiteDatabase): Promise<Photo[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<PhotoRow>('SELECT * FROM photos ORDER BY created_at ASC');
  return rows.map(mapPhoto);
}

export async function getPhotosByTripPlaceId(
  db: SQLiteDatabase,
  tripPlaceId: number
): Promise<Photo[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photos WHERE trip_place_id = ? ORDER BY created_at DESC',
    tripPlaceId
  );
  return rows.map(mapPhoto);
}

/** Общие фото места и фото посещений этого места. */
export async function getPhotosForPlace(db: SQLiteDatabase, placeId: number): Promise<Photo[]> {
  await enableForeignKeys(db);
  const rows = await db.getAllAsync<PhotoRow>(
    `SELECT * FROM photos
     WHERE place_id = ?
        OR trip_place_id IN (SELECT id FROM trip_places WHERE place_id = ?)
     ORDER BY created_at DESC`,
    placeId,
    placeId
  );
  return rows.map(mapPhoto);
}

export async function createPhoto(db: SQLiteDatabase, input: PhotoInput): Promise<Photo> {
  await enableForeignKeys(db);
  const ts = nowIso();
  const result = await db.runAsync(
    'INSERT INTO photos (uri, place_id, trip_place_id, created_at) VALUES (?, ?, ?, ?)',
    input.uri,
    input.placeId ?? null,
    input.tripPlaceId ?? null,
    ts
  );
  const row = await db.getFirstAsync<PhotoRow>('SELECT * FROM photos WHERE id = ?', result.lastInsertRowId);
  if (!row) {
    throw new Error('Не удалось создать фото');
  }
  return mapPhoto(row);
}

export async function deletePhoto(db: SQLiteDatabase, id: number): Promise<void> {
  await enableForeignKeys(db);
  await db.runAsync('DELETE FROM photos WHERE id = ?', id);
}
