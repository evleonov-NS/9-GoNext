import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateDbIfNeeded } from './migrate';
import { seedDemoDataIfNeeded } from './seed';

/** onInit для SQLiteProvider: схема + демо при первом запуске */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateDbIfNeeded(db);
  const seeded = await seedDemoDataIfNeeded(db);
  if (seeded) {
    console.log('[GoNext] Демо-данные §25.1 записаны в SQLite');
  }
}

export { DATABASE_NAME, DATABASE_VERSION, SEED_VERSION } from './constants';
export { migrateDbIfNeeded } from './migrate';
export { seedDemoDataIfNeeded } from './seed';
