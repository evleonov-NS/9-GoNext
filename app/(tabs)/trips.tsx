import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { TripRow } from '@/components/cards';
import { EmptyState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { useTrips } from '@/hooks/useTrips';
import type { TripStatus } from '@/types';
import { pluralPlaces } from '@/utils/plural';
import { textMatchesQuery } from '@/utils/keyboardLayout';
import { formatTripDates, tripListStatusLabel } from '@/utils/tripLabels';

const TRIP_TABS = ['Все', 'Активные', 'Планы', 'Дневники'] as const;

function tabToStatus(tab: (typeof TRIP_TABS)[number]): TripStatus | null {
  switch (tab) {
    case 'Активные':
      return 'active';
    case 'Планы':
      return 'planned';
    case 'Дневники':
      return 'completed';
    default:
      return null;
  }
}

export default function TripsScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { trips, placeCounts, loading, error } = useTrips();
  const [tab, setTab] = useState<(typeof TRIP_TABS)[number]>('Все');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const status = tabToStatus(tab);
    return trips.filter((trip) => {
      if (status && trip.status !== status) return false;
      if (
        !textMatchesQuery(
          `${trip.title} ${trip.description ?? ''} ${trip.startDate ?? ''} ${trip.endDate ?? ''}`,
          search
        )
      ) {
        return false;
      }
      return true;
    });
  }, [trips, tab, search]);

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow="Планы и дневники" title="Поездки" />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Найти поездку"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <View style={styles.chips}>
        {TRIP_TABS.map((label) => (
          <FilterChip
            key={label}
            label={label}
            active={tab === label}
            onPress={() => setTab(label)}
          />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filtered.length === 0 ? (
        <EmptyState
          illustrated={trips.length === 0}
          title={trips.length === 0 ? 'Пока нет поездок' : 'Ничего не найдено'}
          subtitle={
            trips.length === 0
              ? 'Создайте поездку через «＋» или превратите идею из «Хочу» (этап 6).'
              : 'Попробуйте другой запрос или вкладку.'
          }
          actionLabel={trips.length === 0 ? 'Новая поездка' : undefined}
          onAction={
            trips.length === 0 ? () => router.push('/form/trip') : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((trip) => {
            const count = placeCounts.get(trip.id) ?? 0;
            return (
              <TripRow
                key={trip.id}
                title={trip.title}
                dates={formatTripDates(trip.startDate, trip.endDate)}
                statusLabel={tripListStatusLabel(trip.status)}
                countLabel={pluralPlaces(count)}
                onPress={() =>
                  router.push({
                    pathname: '/trip/[id]',
                    params: { id: String(trip.id) },
                  })
                }
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  search: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  list: {
    gap: 11,
  },
  loader: {
    marginTop: 24,
  },
  error: {
    marginTop: 16,
    color: colors.dangerText,
    fontWeight: '600',
  },
  });
}
