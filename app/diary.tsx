import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import type { TFunction } from 'i18next';
import { BackButton, EmptyState, ErrorState } from '@/components/chrome';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CoverImage } from '@/components/CoverImage';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Screen } from '@/components/Screen';
import { artwork } from '@/constants/artwork';
import { useThemedStyles, useAppTheme } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { useTrip, type TripPlaceRow } from '@/hooks/useTrip';
import { getAllPhotos } from '@/repositories/photosRepository';
import type { Photo } from '@/types';
import { dateForTripDay, formatSingleDate } from '@/utils/tripDates';
import { formatTripDates } from '@/utils/tripLabels';

type DayGroup = {
  key: string;
  title: string;
  items: TripPlaceRow[];
};

function groupByDay(
  places: TripPlaceRow[],
  startDate: string | null,
  t: TFunction
): DayGroup[] {
  const ordered = [...places].sort((a, b) => a.sortOrder - b.sortOrder);
  const dayMap = new Map<number, TripPlaceRow[]>();
  const noDay: TripPlaceRow[] = [];

  for (const row of ordered) {
    if (row.dayNumber == null) {
      noDay.push(row);
      continue;
    }
    const list = dayMap.get(row.dayNumber) ?? [];
    list.push(row);
    dayMap.set(row.dayNumber, list);
  }

  const days = [...dayMap.keys()].sort((a, b) => a - b);
  const groups: DayGroup[] = days.map((d) => {
    const dateLabel = formatSingleDate(dateForTripDay(startDate, d));
    const title = dateLabel
      ? t('trip.dayWithDate', { day: d, date: dateLabel })
      : t('trip.dayN', { day: d });
    return { key: `d-${d}`, title, items: dayMap.get(d)! };
  });

  if (noDay.length > 0 || groups.length === 0) {
    groups.push({ key: 'none', title: t('trip.noDay'), items: noDay });
  }

  return groups;
}

export default function DiaryScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = idParam ? Number(idParam) : null;
  const { trip, places, loading, error, refresh } = useTrip(id);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await getAllPhotos(db);
      if (!cancelled) setPhotos(rows);
    })().catch((e) => {
      console.error('[GoNext] diary photos load failed', e);
    });
    return () => {
      cancelled = true;
    };
  }, [db, places]);

  const groups = useMemo(
    () => (trip ? groupByDay(places, trip.startDate, t) : []),
    [places, trip, t]
  );

  const photosFor = (row: TripPlaceRow): Photo[] =>
    photos.filter(
      (photo) => photo.tripPlaceId === row.id || photo.placeId === row.place.id
    );

  if (id == null || !Number.isFinite(id)) {
    return (
      <Screen contentStyle={styles.root}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.chip}>
            <Text style={styles.chipText}>{t('diary.chip')}</Text>
          </View>
        </View>
        <EmptyState
          title={t('diary.emptyTitle')}
          subtitle={t('diary.emptySub')}
          actionLabel={t('diary.emptyAction')}
          onAction={() => router.push('/trips')}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen contentStyle={styles.root}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen contentStyle={styles.root}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
        </View>
        <ErrorState
          message={error ?? t('alerts.tripNotFound')}
          onRetry={() => void refresh()}
        />
      </Screen>
    );
  }

  const visited = places.filter((p) => p.status === 'visited').length;

  return (
    <Screen contentStyle={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.chip}>
          <Text style={styles.chipText}>{t('diary.chip')}</Text>
        </View>
      </View>
      <CoverImage source={artwork.cover} style={styles.cover} />
      <Text style={styles.title}>{trip.title}</Text>
      <Text style={styles.sub}>
        {formatTripDates(trip.startDate, trip.endDate)}
        {' · '}
        {t('diary.visitedOf', { visited, total: places.length })}
      </Text>
      {trip.description ? <Text style={styles.desc}>{trip.description}</Text> : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.items.map((row) => {
            const placePhotos = photosFor(row);
            return (
              <Pressable
                key={row.id}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/place/[id]',
                    params: { id: String(row.place.id) },
                  })
                }
              >
                <View style={styles.cardHead}>
                  <CategoryIcon category={row.place.category} size={40} />
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{row.place.name}</Text>
                    <Text style={styles.cardMeta}>
                      {row.status === 'skipped'
                        ? t('diary.skipped')
                        : row.visitDate
                          ? formatSingleDate(row.visitDate)
                          : row.place.city ?? ''}
                      {row.liked ? ' · ♥' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardBody}>
                  {row.notes?.trim() ? row.notes.trim() : t('diary.noNotes')}
                </Text>
                <PhotoGallery photos={placePhotos} readOnly showAddTile={false} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.diaryBgTop,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
    },
    cover: {
      height: 160,
      borderRadius: radii.card,
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: radii.pill,
      backgroundColor: colors.diaryChipBg,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.diaryChipFg,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      letterSpacing: -1.2,
      color: colors.diaryTitle,
    },
    sub: {
      marginTop: 8,
      marginBottom: 12,
      fontSize: 13.5,
      color: colors.hintText,
    },
    desc: {
      marginBottom: 18,
      fontSize: 14,
      lineHeight: 21,
      color: colors.hintText,
    },
    group: {
      marginBottom: 18,
    },
    groupTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.diaryChipFg,
      marginBottom: 10,
      marginHorizontal: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xxl,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.hintChip,
      marginBottom: 10,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.diaryTitle,
    },
    cardMeta: {
      marginTop: 4,
      fontSize: 12,
      color: colors.hintText,
    },
    cardBody: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 20,
      color: colors.hintText,
    },
  });
}
