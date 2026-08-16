import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Place, Trip, TripIdea } from '@/types';
import { getAllPlaces, getPlaceById } from '@/repositories/placesRepository';
import {
  getAllTripIdeas,
  getTripIdeaPlaceCounts,
} from '@/repositories/tripIdeasRepository';
import {
  getActiveTrip,
  getNextPlannedTrip,
  getPlannedTripsStartingOn,
  getTripPlaceCounts,
  getTripPlaces,
  startTrip,
} from '@/repositories/tripsRepository';
import {
  dismissStartBanner,
  isStartBannerDismissed,
} from '@/utils/startBannerSession';
import { findNextPending, sortByRouteOrder } from '@/utils/nextPlace';
import { todayDateOnly } from '@/utils/tripDates';
import { errorMessage } from '@/utils/errors';

const HOME_IDEAS_LIMIT = 6;
const HOME_PLACES_LIMIT = 4;

export type HomeTripsState = {
  active: Trip | null;
  activePending: number;
  activeVisited: number;
  nextPlaceName: string | null;
  nextPlace: Place | null;
  bannerTrip: Trip | null;
  nextPlanned: Trip | null;
  nextPlannedPlaceCount: number;
  ideas: TripIdea[];
  ideaPlaceCounts: Map<number, number>;
  wantPlaces: Place[];
  loading: boolean;
  error: string | null;
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

function sortWantPlaces(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    if (a.liked !== b.liked) return a.liked ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/** Данные Главной: поездки, баннер, идеи, want-места. */
export function useHomeTrips(): HomeTripsState {
  const db = useSQLiteContext();
  const [active, setActive] = useState<Trip | null>(null);
  const [activePending, setActivePending] = useState(0);
  const [activeVisited, setActiveVisited] = useState(0);
  const [nextPlaceName, setNextPlaceName] = useState<string | null>(null);
  const [nextPlace, setNextPlace] = useState<Place | null>(null);
  const [bannerTrip, setBannerTrip] = useState<Trip | null>(null);
  const [nextPlanned, setNextPlanned] = useState<Trip | null>(null);
  const [nextPlannedPlaceCount, setNextPlannedPlaceCount] = useState(0);
  const [ideas, setIdeas] = useState<TripIdea[]>([]);
  const [ideaPlaceCounts, setIdeaPlaceCounts] = useState<Map<number, number>>(
    new Map()
  );
  const [wantPlaces, setWantPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = todayDateOnly();
      const [
        activeRow,
        starting,
        planned,
        tripCounts,
        ideaRows,
        ideaCounts,
        places,
      ] = await Promise.all([
        getActiveTrip(db),
        getPlannedTripsStartingOn(db, today),
        getNextPlannedTrip(db),
        getTripPlaceCounts(db),
        getAllTripIdeas(db),
        getTripIdeaPlaceCounts(db),
        getAllPlaces(db),
      ]);
      setActive(activeRow);
      if (activeRow) {
        const ordered = sortByRouteOrder(await getTripPlaces(db, activeRow.id));
        setActivePending(ordered.filter((p) => p.status === 'pending').length);
        setActiveVisited(ordered.filter((p) => p.status === 'visited').length);
        const next = findNextPending(ordered);
        if (next) {
          const place = await getPlaceById(db, next.placeId);
          setNextPlace(place);
          setNextPlaceName(place?.name ?? null);
        } else {
          setNextPlace(null);
          setNextPlaceName(null);
        }
      } else {
        setActivePending(0);
        setActiveVisited(0);
        setNextPlace(null);
        setNextPlaceName(null);
      }

      const candidate = starting.find((t) => !isStartBannerDismissed(t.id)) ?? null;
      setBannerTrip(candidate);

      setNextPlanned(activeRow ? null : planned);
      setNextPlannedPlaceCount(planned ? tripCounts.get(planned.id) ?? 0 : 0);

      setIdeas(ideaRows.filter((idea) => idea.status === 'active').slice(0, HOME_IDEAS_LIMIT));
      setIdeaPlaceCounts(ideaCounts);
      setWantPlaces(
        sortWantPlaces(places.filter((p) => p.visitLater)).slice(0, HOME_PLACES_LIMIT)
      );
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
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
    nextPlace,
    bannerTrip,
    nextPlanned,
    nextPlannedPlaceCount,
    ideas,
    ideaPlaceCounts,
    wantPlaces,
    loading,
    error,
    dismissBanner,
    startBannerTrip,
    refresh,
  };
}
