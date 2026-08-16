import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Photo } from '@/types';
import {
  getPhotosByTripPlaceId,
  getPhotosForPlace,
} from '@/repositories/photosRepository';
import {
  pickImagesFromLibrary,
  removePhotoWithFile,
  savePickedPhotos,
  takePhotoWithCamera,
  type PhotoLink,
} from '@/services/photos';

type Query = {
  placeId?: number | null;
  tripPlaceId?: number | null;
};

export function usePhotos(query: Query): {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addFromLibrary: (link?: PhotoLink) => Promise<Photo[]>;
  addFromCamera: (link?: PhotoLink) => Promise<Photo[]>;
  remove: (id: number) => Promise<void>;
} {
  const db = useSQLiteContext();
  const placeId =
    query.placeId != null && Number.isFinite(query.placeId) ? query.placeId : null;
  const tripPlaceId =
    query.tripPlaceId != null && Number.isFinite(query.tripPlaceId)
      ? query.tripPlaceId
      : null;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (placeId == null && tripPlaceId == null) {
      setPhotos([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows =
        tripPlaceId != null
          ? await getPhotosByTripPlaceId(db, tripPlaceId)
          : await getPhotosForPlace(db, placeId!);
      setPhotos(rows);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка чтения фото';
      setError(message);
      console.error('[GoNext] photos load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db, placeId, tripPlaceId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const resolvedLink = useCallback(
    (link?: PhotoLink): PhotoLink => ({
      placeId: link?.placeId ?? placeId,
      tripPlaceId: link?.tripPlaceId ?? tripPlaceId,
    }),
    [placeId, tripPlaceId]
  );

  const addFromLibrary = useCallback(
    async (link?: PhotoLink) => {
      const assets = await pickImagesFromLibrary();
      if (assets.length === 0) return [];
      const created = await savePickedPhotos(db, assets, resolvedLink(link));
      await refresh();
      return created;
    },
    [db, refresh, resolvedLink]
  );

  const addFromCamera = useCallback(
    async (link?: PhotoLink) => {
      const asset = await takePhotoWithCamera();
      if (!asset) return [];
      const created = await savePickedPhotos(db, [asset], resolvedLink(link));
      await refresh();
      return created;
    },
    [db, refresh, resolvedLink]
  );

  const remove = useCallback(
    async (id: number) => {
      await removePhotoWithFile(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return {
    photos,
    loading,
    error,
    refresh,
    addFromLibrary,
    addFromCamera,
    remove,
  };
}
