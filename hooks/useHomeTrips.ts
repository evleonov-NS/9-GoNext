import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Trip } from '@/types';
import { getPlaceById } from '@/repositories/placesRepository';
import {
  getActiveTrip,
  getPlannedTripsStartingOn,
  getTripPlaces,
  startTrip,
} from '@/repositories/tripsRepository';
import {
  dismissStartBanner,
  isStartBannerDismissed,
} from '@/utils/startBannerSession';
import { todayDateOnly } from '@/utils/tripDates';

export type HomeTripsState = {
  active: Trip | null;
  activePending: number;
  activeVisited: number;
  nextPlaceName: string | null;
  bannerTrip: Trip | null;
  loading: boolean;
  dismissBanner: () => void;
  startBannerTrip: (opts?: {
    completePrevious?: boolean;
  }) => Promise<
    | { ok: true; trip: Trip }
    | { ok: false; reason: 'need_dates' }
    | { ok: false; reason: 'active_conflict'; activeTrip: Trip }
  >;
  refresh: () => Promise<void>;
};

/** Данные для баннера старта и блока активной поездки на Главной. */
export function useHomeTrips(): HomeTripsState {
  const db = useSQLiteContext();
  const [active, setActive] = useState<Trip | null>(null);
  const [activePending, setActivePending] = useState(0);
  const [activeVisited, setActiveVisited] = useState(0);
  const [nextPlaceName, setNextPlaceName] = useState<string | null>(null);
  const [bannerTrip, setBannerTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissTick, setDismissTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const today = todayDateOnly();
      const [activeRow, starting] = await Promise.all([
        getActiveTrip(db),
        getPlannedTripsStartingOn(db, today),
      ]);
      setActive(activeRow);
      if (activeRow) {
        const places = await getTripPlaces(db, activeRow.id);
        const ordered = [...places].sort((a, b) => a.sortOrder - b.sortOrder);
        setActivePending(ordered.filter((p) => p.status === 'pending').length);
        setActiveVisited(ordered.filter((p) => p.status === 'visited').length);
        const next = ordered.find((p) => p.status === 'pending');
        if (next) {
          const place = await getPlaceById(db, next.placeId);
          setNextPlaceName(place?.name ?? null);
        } else {
          setNextPlaceName(null);
        }
      } else {
        setActivePending(0);
        setActiveVisited(0);
        setNextPlaceName(null);
      }

      const candidate = starting.find((t) => !isStartBannerDismissed(t.id)) ?? null;
      setBannerTrip(candidate);
    } catch (e) {
      console.error('[GoNext] home trips load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db, dismissTick]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const dismissBanner = useCallback(() => {
    if (bannerTrip) {
      dismissStartBanner(bannerTrip.id);
      setDismissTick((n) => n + 1);
    }
  }, [bannerTrip]);

  const startBannerTrip = useCallback(
    async (opts?: { completePrevious?: boolean }) => {
      if (!bannerTrip) throw new Error('Нет поездки для старта');
      if (!bannerTrip.startDate || !bannerTrip.endDate) {
        return { ok: false as const, reason: 'need_dates' as const };
      }
      try {
        const trip = await startTrip(db, bannerTrip.id, {
          completePrevious: opts?.completePrevious,
        });
        dismissStartBanner(bannerTrip.id);
        await refresh();
        return { ok: true as const, trip };
      } catch (e) {
        if (e instanceof Error && e.message === 'ACTIVE_CONFLICT') {
          const activeTrip = (e as Error & { activeTrip: Trip }).activeTrip;
          return { ok: false as const, reason: 'active_conflict' as const, activeTrip };
        }
        throw e;
      }
    },
    [bannerTrip, db, refresh]
  );

  return {
    active,
    activePending,
    activeVisited,
    nextPlaceName,
    bannerTrip,
    loading,
    dismissBanner,
    startBannerTrip,
    refresh,
  };
}
