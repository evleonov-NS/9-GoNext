import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TripRow } from '@/components/cards';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';

const TRIP_TABS = ['Все', 'Активные', 'Планы', 'Дневники'] as const;

export default function TripsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TRIP_TABS)[number]>('Все');

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow="Планы и дневники" title="Поездки" />
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
      <View style={styles.list}>
        <TripRow
          title="Карелия"
          dates="10–16 авг 2026"
          statusLabel="АКТИВНАЯ"
          countLabel="6 мест"
          onPress={() =>
            router.push({ pathname: '/trip/[id]', params: { id: 'karelia' } })
          }
        />
        <TripRow
          title="Выборг на выходные"
          dates="12–14 сен 2026"
          statusLabel="ПЛАН"
          countLabel="4 места"
          onPress={() =>
            router.push({ pathname: '/trip/[id]', params: { id: 'vyborg' } })
          }
        />
        <TripRow
          title="Карелия 2025"
          dates="июль 2025"
          statusLabel="ДНЕВНИК"
          countLabel="7 мест"
          onPress={() => router.push('/diary')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  list: {
    gap: 11,
  },
});
