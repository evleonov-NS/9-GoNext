import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_VERSION } from './constants';

const SCHEMA_V1 = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  description TEXT,
  category TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  visit_later INTEGER NOT NULL DEFAULT 0,
  liked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trip_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trip_idea_places (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  idea_id INTEGER NOT NULL,
  place_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  priority TEXT NOT NULL DEFAULT 'optional',
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES trip_ideas(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id),
  UNIQUE (idea_id, place_id)
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  current INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trip_places (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  trip_id INTEGER NOT NULL,
  place_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  day_number INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  visit_date TEXT,
  liked INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'optional',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id)
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  uri TEXT NOT NULL,
  place_id INTEGER,
  trip_place_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL,
  FOREIGN KEY (trip_place_id) REFERENCES trip_places(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  if (current >= DATABASE_VERSION) {
    return;
  }

  if (current === 0) {
    await db.execAsync(SCHEMA_V1);
    current = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
