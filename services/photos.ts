import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { copyAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import i18n from '@/i18n';
import type { Photo } from '@/types';
import {
  createPhoto,
  deletePhoto,
  getPhotoById,
} from '@/repositories/photosRepository';

export type PhotoLink = {
  placeId?: number | null;
  tripPlaceId?: number | null;
};

const PHOTOS_DIR = 'photos';

function photosDirectory(): Directory {
  return new Directory(Paths.document, PHOTOS_DIR);
}

function ensurePhotosDir(): Directory {
  const dir = photosDirectory();
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function extFromAsset(asset: ImagePicker.ImagePickerAsset): string {
  const name = asset.fileName ?? asset.uri;
  const raw = name.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? '';
  if (raw === 'jpeg' || raw === 'jpg') return 'jpg';
  if (raw === 'png' || raw === 'webp' || raw === 'gif' || raw === 'heic') return raw;
  if (raw === 'heif') return 'heic';
  if (asset.mimeType?.includes('png')) return 'png';
  if (asset.mimeType?.includes('webp')) return 'webp';
  return 'jpg';
}

function uniqueName(ext: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand}.${ext}`;
}

/** URI, который можно показать в Image и который переживает перезапуск (наш файл). */
export function isAppPhotoUri(uri: string): boolean {
  if (!uri.startsWith('file:')) return false;
  try {
    return uri.startsWith(photosDirectory().uri);
  } catch {
    return false;
  }
}

export function isDisplayablePhotoUri(uri: string): boolean {
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph:') ||
    uri.startsWith('http:') ||
    uri.startsWith('https:') ||
    uri.startsWith('data:')
  );
}

async function persistPickedImage(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (Platform.OS === 'web') {
    return asset.uri;
  }

  const dir = ensurePhotosDir();
  const dest = new File(dir, uniqueName(extFromAsset(asset)));

  try {
    const source = new File(asset.uri);
    source.copy(dest);
  } catch (e) {
    console.warn('[GoNext] File.copy fallback to copyAsync', e);
    await copyAsync({ from: asset.uri, to: dest.uri });
  }

  if (!dest.exists) {
    throw new Error(i18n.t('alerts.photoSaveFailed'));
  }
  return dest.uri;
}

function deleteLocalPhotoFile(uri: string): void {
  if (Platform.OS === 'web') return;
  if (!isAppPhotoUri(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('[GoNext] photo file delete skipped', e);
  }
}

export async function pickImagesFromLibrary(): Promise<ImagePicker.ImagePickerAsset[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(i18n.t('alerts.galleryDenied'));
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.85,
  });
  if (result.canceled) return [];
  return result.assets;
}

export async function takePhotoWithCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error(i18n.t('alerts.cameraDenied'));
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

export async function savePickedPhotos(
  db: SQLiteDatabase,
  assets: ImagePicker.ImagePickerAsset[],
  link: PhotoLink
): Promise<Photo[]> {
  const created: Photo[] = [];
  for (const asset of assets) {
    const uri = await persistPickedImage(asset);
    const photo = await createPhoto(db, {
      uri,
      placeId: link.placeId ?? null,
      tripPlaceId: link.tripPlaceId ?? null,
    });
    created.push(photo);
  }
  return created;
}

export async function removePhotoWithFile(db: SQLiteDatabase, id: number): Promise<void> {
  const photo = await getPhotoById(db, id);
  if (!photo) return;
  deleteLocalPhotoFile(photo.uri);
  await deletePhoto(db, id);
}
