import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { zipSync, strToU8 } from 'fflate';
import { __version__ } from '@/constants/version';
import i18n from '@/i18n';
import { getAllPlaces } from '@/repositories/placesRepository';
import { getAllPhotos } from '@/repositories/photosRepository';
import {
  getAllTripIdeaPlaces,
  getAllTripIdeas,
} from '@/repositories/tripIdeasRepository';
import { getAllTripPlaces, getAllTrips } from '@/repositories/tripsRepository';
import { isAppPhotoUri } from '@/services/photos';
import type { Photo } from '@/types';

export const BACKUP_FORMAT = 'gonext-backup';
export const BACKUP_FORMAT_VERSION = 1;

type BackupPhoto = Photo & { file: string | null };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function stamp(date = new Date()): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function photoFileName(photo: Photo, used: Set<string>): string | null {
  if (!isAppPhotoUri(photo.uri)) return null;
  const raw = photo.uri.split('/').pop()?.split('?')[0] ?? '';
  const base = raw || `photo-${photo.id}.jpg`;
  let name = base;
  let i = 2;
  while (used.has(name)) {
    const dot = base.lastIndexOf('.');
    name = dot > 0 ? `${base.slice(0, dot)}-${i}${base.slice(dot)}` : `${base}-${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}

async function readPhotoBytes(uri: string): Promise<Uint8Array | null> {
  try {
    const file = new File(uri);
    if (!file.exists) return null;
    return await file.bytes();
  } catch (e) {
    console.warn('[GoNext] backup skip photo', uri, e);
    return null;
  }
}

function downloadOnWeb(bytes: Uint8Array, fileName: string): void {
  const g = globalThis as typeof globalThis & {
    document?: {
      createElement: (tag: string) => {
        href: string;
        download: string;
        click: () => void;
      };
    };
    URL?: { createObjectURL: (blob: Blob) => string; revokeObjectURL: (url: string) => void };
  };
  if (!g.document || !g.URL) {
    throw new Error(i18n.t('settings.exportUnavailable'));
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: 'application/zip' });
  const url = g.URL.createObjectURL(blob);
  const a = g.document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  g.URL.revokeObjectURL(url);
}

export async function exportBackupAndShare(db: SQLiteDatabase): Promise<void> {
  const [places, tripIdeas, tripIdeaPlaces, trips, tripPlaces, photos] = await Promise.all([
    getAllPlaces(db),
    getAllTripIdeas(db),
    getAllTripIdeaPlaces(db),
    getAllTrips(db),
    getAllTripPlaces(db),
    getAllPhotos(db),
  ]);

  const usedNames = new Set<string>();
  const zipFiles: Record<string, Uint8Array> = {};
  const backupPhotos: BackupPhoto[] = [];

  for (const photo of photos) {
    const name = photoFileName(photo, usedNames);
    let file: string | null = null;
    if (name) {
      const bytes = await readPhotoBytes(photo.uri);
      if (bytes) {
        file = `photos/${name}`;
        zipFiles[file] = bytes;
      }
    }
    backupPhotos.push({ ...photo, file });
  }

  const payload = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: __version__,
    exportedAt: new Date().toISOString(),
    places,
    tripIdeas,
    tripIdeaPlaces,
    trips,
    tripPlaces,
    photos: backupPhotos,
  };

  zipFiles['gonext.json'] = strToU8(`${JSON.stringify(payload, null, 2)}\n`);
  const zipped = zipSync(zipFiles, { level: 6 });
  const fileName = `GoNext-${__version__}-backup-${stamp()}.zip`;

  if (Platform.OS === 'web') {
    downloadOnWeb(zipped, fileName);
    return;
  }

  const dest = new File(Paths.cache, fileName);
  if (dest.exists) dest.delete();
  dest.create();
  dest.write(zipped);

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error(i18n.t('settings.exportUnavailable'));
    }
    await Sharing.shareAsync(dest.uri, {
      mimeType: 'application/zip',
      UTI: 'public.zip-archive',
      dialogTitle: i18n.t('settings.export'),
    });
  } finally {
    try {
      if (dest.exists) dest.delete();
    } catch (e) {
      console.warn('[GoNext] backup zip cleanup skipped', e);
    }
  }
}
