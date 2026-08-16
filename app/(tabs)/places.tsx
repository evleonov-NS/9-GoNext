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
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';
import { PlaceRow } from '@/components/cards';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState, ErrorState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';
import { PLACE_CATEGORY_LIST, type PlaceCategoryId } from '@/constants/categories';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { usePlaces } from '@/hooks/usePlaces';
import { textMatchesQuery } from '@/utils/keyboardLayout';

const PLACE_TABS = ['all', 'visitLater', 'visited', 'liked'] as const;

export default function PlacesScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();
  const { places, visitedIds, loading, error, update, refresh } = usePlaces();
  const [tab, setTab] = useState<(typeof PLACE_TABS)[number]>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PlaceCategoryId | null>(null);

  const filtered = useMemo(() => {
    return places.filter((place) => {
      if (tab === 'visitLater' && !place.visitLater) return false;
      if (tab === 'liked' && !place.liked) return false;
      if (tab === 'visited' && !visitedIds.has(place.id)) return false;
      if (category && place.category !== category) return false;

      const haystack = `${place.name} ${place.city ?? ''}`;
      if (!textMatchesQuery(haystack, search)) return false;
      return true;
    });
  }, [places, search, tab, category, visitedIds]);

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow={t('places.eyebrow')} title={t('places.title')} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('places.search')}
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
        {PLACE_TABS.map((id) => (
          <FilterChip
            key={id}
            label={t(`places.tabs.${id}`)}
            active={tab === id}
            onPress={() => setTab(id)}
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
                {t(`categoryShort.${cat.id}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          illustrated={places.length === 0}
          title={places.length === 0 ? t('places.emptyTitle') : t('places.notFoundTitle')}
          subtitle={
            places.length === 0 ? t('places.emptySub') : t('places.notFoundSub')
          }
          actionLabel={places.length === 0 ? t('places.emptyAction') : undefined}
          onAction={
            places.length === 0 ? () => router.push('/form/place') : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          <Text style={styles.meta}>
            {t('common.of', { filtered: filtered.length, total: places.length })}
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
  });
}
