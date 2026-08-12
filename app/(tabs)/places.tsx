import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlaceRow } from '@/components/cards';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';
import { PLACE_CATEGORY_LIST } from '@/constants/categories';
import { colors, radii } from '@/constants/theme';
import { usePlaces } from '@/hooks/usePlaces';
import { Text } from 'react-native-paper';

const PLACE_TABS = ['Все', 'Хочу посетить', 'Посещённые', 'Понравилось'] as const;

export default function PlacesScreen() {
  const router = useRouter();
  const { places, loading, error } = usePlaces();
  const [tab, setTab] = useState<(typeof PLACE_TABS)[number]>('Все');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places.filter((place) => {
      if (tab === 'Хочу посетить' && !place.visitLater) return false;
      if (tab === 'Понравилось' && !place.liked) return false;
      // «Посещённые» полноценно — на этапе 3 (через TripPlace); пока не режем список
      if (q && !place.name.toLowerCase().includes(q) && !(place.city ?? '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [places, search, tab]);

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow="Личная база" title="Места" />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Поиск по местам"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}
      >
        {PLACE_TABS.map((label) => (
          <FilterChip
            key={label}
            label={label}
            active={tab === label}
            onPress={() => setTab(label)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cats}
      >
        {PLACE_CATEGORY_LIST.map((cat) => (
          <View key={cat.id} style={styles.catItem}>
            <CategoryIcon category={cat.id} size={44} />
            <Text style={styles.catLabel}>{cat.shortLabel}</Text>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.list}>
          <Text style={styles.meta}>SQLite · {filtered.length} из {places.length}</Text>
          {filtered.map((place) => (
            <PlaceRow
              key={place.id}
              name={place.name}
              city={place.city ?? ''}
              category={place.category}
              onPress={() =>
                router.push({ pathname: '/place/[id]', params: { id: String(place.id) } })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  chipsScroll: {
    marginHorizontal: -18,
    marginBottom: 14,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 2,
  },
  cats: {
    gap: 12,
    marginBottom: 16,
    paddingRight: 8,
  },
  catItem: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  loader: {
    marginTop: 24,
  },
  error: {
    marginTop: 16,
    color: '#b42318',
    fontWeight: '600',
  },
});
