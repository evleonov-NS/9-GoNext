import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BackButton } from '@/components/chrome';
import { CoverImage } from '@/components/CoverImage';
import { Screen } from '@/components/Screen';
import { TripPlaceSheet } from '@/components/TripPlaceSheet';
import { artwork } from '@/constants/artwork';
import { PLACE_CATEGORIES } from '@/constants/categories';
import { PLACE_PRIORITIES } from '@/constants/priorities';
import { colors, radii } from '@/constants/theme';
import {
  markVisitedToday,
  useTrip,
  type TripPlaceRow,
} from '@/hooks/useTrip';
import type { PlacePriority, Trip, TripPlaceStatus } from '@/types';
import { pluralPlaces } from '@/utils/plural';
import {
  dateForTripDay,
  formatSingleDate,
  tripDayChipNumbers,
} from '@/utils/tripDates';
import {
  formatTripDates,
  tripPlaceStatusLabel,
  tripStatusLabel,
} from '@/utils/tripLabels';

type DayGroup = {
  key: string;
  title: string;
  items: TripPlaceRow[];
};

function groupByDay(
  places: TripPlaceRow[],
  startDate: string | null
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
    const title = dateLabel ? `День ${d} · ${dateLabel}` : `День ${d}`;
    return { key: `d-${d}`, title, items: dayMap.get(d)! };
  });

  if (noDay.length > 0 || groups.length === 0) {
    groups.push({ key: 'none', title: 'Без дня', items: noDay });
  }

  return groups;
}

function confirmStartConflict(
  activeTrip: Trip,
  nextTitle: string,
  onConfirm: () => void
) {
  Alert.alert(
    'Уже есть активная поездка',
    `«${activeTrip.title}» ещё не завершена. Завершить её и начать «${nextTitle}»?`,
    [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Завершить и начать', onPress: onConfirm },
    ]
  );
}

export default function TripCardScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = idParam ? Number(idParam) : null;
  const {
    trip,
    places,
    loading,
    error,
    updatePlace,
    movePlace,
    removePlace,
    tryStart,
    complete,
    tryReactivate,
    pendingCount,
    visitedCount,
  } = useTrip(id);

  const [sheetItem, setSheetItem] = useState<TripPlaceRow | null>(null);

  useEffect(() => {
    if (!sheetItem) return;
    const fresh = places.find((p) => p.id === sheetItem.id);
    if (fresh) setSheetItem(fresh);
    else setSheetItem(null);
  }, [places, sheetItem?.id]);

  const orderedPlaces = useMemo(
    () => [...places].sort((a, b) => a.sortOrder - b.sortOrder),
    [places]
  );

  const sheetIndex = useMemo(
    () => (sheetItem ? orderedPlaces.findIndex((p) => p.id === sheetItem.id) : -1),
    [orderedPlaces, sheetItem]
  );

  const dayOptions = useMemo(
    () =>
      trip
        ? tripDayChipNumbers(
            trip.startDate,
            trip.endDate,
            places.map((p) => p.dayNumber)
          )
        : [],
    [trip, places]
  );

  const groups = useMemo(
    () => (trip ? groupByDay(places, trip.startDate) : []),
    [trip, places]
  );

  const offerCompleteIfDone = (nextPending: number) => {
    if (!trip || trip.status !== 'active') return;
    if (nextPending > 0) return;
    Alert.alert(
      'Маршрут пройден',
      `Все места в «${trip.title}» отмечены. Завершить поездку?`,
      [
        { text: 'Позже', style: 'cancel' },
        {
          text: 'Завершить',
          onPress: () => {
            void complete();
          },
        },
      ]
    );
  };

  const runStart = async (completePrevious?: boolean) => {
    const result = await tryStart({ completePrevious });
    if (result.ok) return;
    if (result.reason === 'need_dates') {
      Alert.alert(
        'Нужны даты',
        'Чтобы начать поездку, укажите дату начала и окончания.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Указать даты',
            onPress: () =>
              router.push({
                pathname: '/form/trip',
                params: { id: String(trip!.id), focusDates: '1' },
              }),
          },
        ]
      );
      return;
    }
    if (result.reason === 'active_conflict') {
      confirmStartConflict(result.activeTrip, trip!.title, () => {
        void runStart(true);
      });
    }
  };

  const runReactivate = async (completePrevious?: boolean) => {
    const result = await tryReactivate({ completePrevious });
    if (result.ok) return;
    if (result.reason === 'active_conflict') {
      confirmStartConflict(result.activeTrip, trip!.title, () => {
        void runReactivate(true);
      });
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.error}>{error ?? 'Поездка не найдена'}</Text>
        </View>
      </Screen>
    );
  }

  const datesLabel = formatTripDates(trip.startDate, trip.endDate);

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            поездка · {tripStatusLabel(trip.status).toLowerCase()}
          </Text>
        </View>
      </View>

      <CoverImage source={artwork.cover} style={styles.cover} />

      <Text style={styles.title}>{trip.title}</Text>
      <Text style={styles.dates}>{datesLabel}</Text>
      {trip.description ? <Text style={styles.desc}>{trip.description}</Text> : null}

      <View style={styles.stats}>
        <View>
          <Text style={styles.statValue}>{places.length}</Text>
          <Text style={styles.statLabel}>мест</Text>
        </View>
        <View>
          <Text style={styles.statValue}>{visitedCount}</Text>
          <Text style={styles.statLabel}>посещено</Text>
        </View>
        <View>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>осталось</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {trip.status === 'active' ? (
          <>
            <Pressable style={styles.primary} onPress={() => router.push('/next')}>
              <Text style={styles.primaryText}>Следующее место</Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={() =>
                Alert.alert(
                  'Завершить поездку?',
                  `«${trip.title}» станет дневником. Продолжить?`,
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Завершить',
                      onPress: () => {
                        void complete();
                      },
                    },
                  ]
                )
              }
            >
              <Text style={styles.secondaryText}>Завершить</Text>
            </Pressable>
          </>
        ) : null}

        {trip.status === 'planned' ? (
          <Pressable style={styles.primary} onPress={() => void runStart()}>
            <Text style={styles.primaryText}>Начать поездку</Text>
          </Pressable>
        ) : null}

        {trip.status === 'completed' ? (
          <>
            <Pressable style={styles.secondary} onPress={() => router.push('/diary')}>
              <Text style={styles.secondaryText}>Дневник</Text>
            </Pressable>
            <Pressable
              style={styles.primary}
              onPress={() =>
                Alert.alert(
                  'Вернуть в активные?',
                  'Поездка снова станет текущей.',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Вернуть',
                      onPress: () => {
                        void runReactivate();
                      },
                    },
                  ]
                )
              }
            >
              <Text style={styles.primaryText}>Снова активная</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Маршрут</Text>
        <Text style={styles.sectionMeta}>{pluralPlaces(places.length)}</Text>
      </View>

      {groups.map((group) => (
        <View key={group.key} style={styles.dayBlock}>
          <Text style={styles.day}>{group.title}</Text>
          <View style={styles.listCard}>
            {group.items.length === 0 ? (
              <Text style={styles.emptyList}>Нет мест в этой группе</Text>
            ) : (
              group.items.map((row, index) => {
                const cat = PLACE_CATEGORIES[row.place.category];
                const prio = PLACE_PRIORITIES[row.priority];
                const statusBit =
                  row.status === 'pending'
                    ? null
                    : tripPlaceStatusLabel(row.status);
                const sub = [
                  row.place.city ?? cat.shortLabel,
                  statusBit,
                  row.notes,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <Pressable
                    key={row.id}
                    style={[styles.placeRow, index > 0 && styles.placeRowSep]}
                    onPress={() => setSheetItem(row)}
                  >
                    <CategoryIcon category={row.place.category} size={40} />
                    <View style={styles.placeText}>
                      <Text style={styles.placeName}>{row.place.name}</Text>
                      <Text style={styles.placeMeta}>{sub}</Text>
                    </View>
                    <View style={[styles.prio, { backgroundColor: prio.bg }]}>
                      <Text style={[styles.prioText, { color: prio.fg }]}>
                        {prio.label}
                      </Text>
                    </View>
                    <Text style={styles.more}>⋯</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      ))}

      <Pressable
        style={styles.addBtn}
        onPress={() =>
          router.push({
            pathname: '/picker',
            params: { mode: 'trip', tripId: String(trip.id) },
          })
        }
      >
        <Text style={styles.addBtnText}>+ Добавить место</Text>
      </Pressable>

      <Pressable
        style={styles.editBtn}
        onPress={() =>
          router.push({ pathname: '/form/trip', params: { id: String(trip.id) } })
        }
      >
        <Text style={styles.editBtnText}>Изменить поездку</Text>
      </Pressable>

      <TripPlaceSheet
        item={sheetItem}
        visible={sheetItem != null}
        dayOptions={dayOptions}
        canMoveUp={sheetIndex > 0}
        canMoveDown={sheetIndex >= 0 && sheetIndex < orderedPlaces.length - 1}
        onClose={() => setSheetItem(null)}
        onChangeDay={(dayNumber) => {
          if (!sheetItem) return;
          void updatePlace(sheetItem.id, { dayNumber }).then(() => {
            setSheetItem((prev) => (prev ? { ...prev, dayNumber } : prev));
          });
        }}
        onChangePriority={(priority: PlacePriority) => {
          if (!sheetItem) return;
          void updatePlace(sheetItem.id, { priority }).then(() => {
            setSheetItem((prev) => (prev ? { ...prev, priority } : prev));
          });
        }}
        onSaveNotes={(notes) => {
          if (!sheetItem) return;
          void updatePlace(sheetItem.id, { notes }).then(() => {
            setSheetItem((prev) => (prev ? { ...prev, notes } : prev));
          });
        }}
        onMove={(direction) => {
          if (!sheetItem) return;
          void movePlace(sheetItem.id, direction);
        }}
        onSetStatus={(status: TripPlaceStatus) => {
          if (!sheetItem) return;
          const linkId = sheetItem.id;
          const visitDate =
            status === 'visited'
              ? markVisitedToday()
              : status === 'pending'
                ? null
                : sheetItem.visitDate;
          const shouldClose = status === 'visited' || status === 'skipped';
          void updatePlace(linkId, { status, visitDate }).then(() => {
            if (shouldClose) {
              setSheetItem(null);
            } else {
              setSheetItem((prev) =>
                prev ? { ...prev, status, visitDate } : prev
              );
            }
            const nextPending = places.filter((p) => {
              if (p.id === linkId) return status === 'pending';
              return p.status === 'pending';
            }).length;
            offerCompleteIfDone(nextPending);
          });
        }}
        onRemove={() => {
          if (!sheetItem) return;
          const name = sheetItem.place.name;
          const linkId = sheetItem.id;
          Alert.alert(
            'Удалить из поездки?',
            `«${name}» останется в общей базе «Места» — удалится только из маршрута этой поездки.`,
            [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Удалить',
                style: 'destructive',
                onPress: () => {
                  setSheetItem(null);
                  void removePlace(linkId);
                },
              },
            ]
          );
        }}
        onOpenPlace={() => {
          if (!sheetItem) return;
          const placeId = sheetItem.place.id;
          setSheetItem(null);
          router.push({ pathname: '/place/[id]', params: { id: String(placeId) } });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: '#e5f0ea',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
  cover: {
    height: 160,
    borderRadius: radii.card,
  },
  title: {
    marginTop: 16,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.text,
  },
  dates: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  desc: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  stats: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 28,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 9,
  },
  primary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: {
    fontWeight: '800',
    color: colors.text,
  },
  sectionRow: {
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayBlock: {
    marginBottom: 14,
  },
  day: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  emptyList: {
    paddingVertical: 18,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
  },
  placeRowSep: {
    borderTopWidth: 1,
    borderTopColor: '#f0f1ec',
  },
  placeText: {
    flex: 1,
  },
  placeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },
  placeMeta: {
    marginTop: 4,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  prio: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.pill,
    maxWidth: 100,
  },
  prioText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  more: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
    paddingLeft: 4,
  },
  addBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d3d5cc',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#5c5f57',
  },
  editBtn: {
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: {
    fontWeight: '800',
    color: colors.text,
  },
  error: {
    color: '#b42318',
    fontWeight: '600',
  },
});
