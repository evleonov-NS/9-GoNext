import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { PlaceRow } from '@/components/cards';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';
import { PLACE_CATEGORY_LIST, type PlaceCategoryId } from '@/constants/categories';
import { colors, radii } from '@/constants/theme';
import { usePlaces } from '@/hooks/usePlaces';
import { textMatchesQuery } from '@/utils/keyboardLayout';

const PLACE_TABS = ['Все', 'Хочу посетить', 'Посещённые', 'Понравилось'] as const;

export default function PlacesScreen() {
  const router = useRouter();
  const { places, visitedIds, loading, error, update } = usePlaces();
  const [tab, setTab] = useState<(typeof PLACE_TABS)[number]>('Все');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PlaceCategoryId | null>(null);

  const filtered = useMemo(() => {
    return places.filter((place) => {
      if (tab === 'Хочу посетить' && !place.visitLater) return false;
      if (tab === 'Понравилось' && !place.liked) return false;
      if (tab === 'Посещённые' && !visitedIds.has(place.id)) return false;
      if (category && place.category !== category) return false;

      const haystack = `${place.name} ${place.city ?? ''}`;
      if (!textMatchesQuery(haystack, search)) return false;
      return true;
    });
  }, [places, search, tab, category, visitedIds]);

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow="Личная база" title="Места" />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Поиск по местам"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
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
        {PLACE_CATEGORY_LIST.map((cat) => {
          const active = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={styles.catItem}
              onPress={() => setCategory(active ? null : cat.id)}
            >
              <View style={[styles.catRing, active && styles.catRingActive]}>
                <CategoryIcon category={cat.id} size={44} />
              </View>
              <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                {cat.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={places.length === 0 ? 'Пока нет мест' : 'Ничего не найдено'}
          subtitle={
            places.length === 0
              ? 'Добавьте место через «＋» — оно появится в общей базе.'
              : 'Попробуйте другой запрос, фильтр или категорию.'
          }
          actionLabel={places.length === 0 ? 'Добавить место' : undefined}
          onAction={
            places.length === 0 ? () => router.push('/form/place') : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          <Text style={styles.meta}>
            {filtered.length} из {places.length}
          </Text>
          {filtered.map((place) => (
            <PlaceRow
              key={place.id}
              name={place.name}
              city={place.city ?? ''}
              category={place.category}
              liked={place.liked}
              onPress={() =>
                router.push({ pathname: '/place/[id]', params: { id: String(place.id) } })
              }
              onToggleLiked={() => {
                void update(place.id, { liked: !place.liked });
              }}
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
  catRing: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 1,
  },
  catRingActive: {
    borderColor: colors.accent,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  catLabelActive: {
    color: colors.accent,
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
