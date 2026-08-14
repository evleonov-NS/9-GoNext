import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { IdeaCard, PlaceRow } from '@/components/cards';
import { EmptyState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';
import {
  ideaCoverForId,
  ideaStatusLabel,
} from '@/constants/priorities';
import { colors, radii } from '@/constants/theme';
import { useTripIdeas } from '@/hooks/useTripIdeas';
import { updatePlace } from '@/repositories/placesRepository';
import { useSQLiteContext } from 'expo-sqlite';
import { textMatchesQuery } from '@/utils/keyboardLayout';

const WANT_TABS = ['Направления', 'Что посетить'] as const;
const IDEA_FILTERS = ['Активные', 'Все', 'Архив'] as const;

function pluralPlaces(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} место`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} места`;
  return `${n} мест`;
}

export default function WantScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { ideas, placeCounts, visitLaterPlaces, loading, error, refresh } = useTripIdeas();
  const [tab, setTab] = useState<(typeof WANT_TABS)[number]>('Направления');
  const [ideaFilter, setIdeaFilter] = useState<(typeof IDEA_FILTERS)[number]>('Активные');
  const [search, setSearch] = useState('');

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (ideaFilter === 'Активные' && idea.status !== 'active') return false;
      if (ideaFilter === 'Архив' && idea.status !== 'archived') return false;
      if (!textMatchesQuery(`${idea.title} ${idea.description ?? ''}`, search)) return false;
      return true;
    });
  }, [ideas, ideaFilter, search]);

  const filteredWantPlaces = useMemo(() => {
    return visitLaterPlaces.filter((place) =>
      textMatchesQuery(`${place.name} ${place.city ?? ''}`, search)
    );
  }, [visitLaterPlaces, search]);

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow="Планы без обязательств" title="Хочу" />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Найти направление или место"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <View style={styles.chips}>
        {WANT_TABS.map((label) => (
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
      ) : tab === 'Направления' ? (
        <View style={styles.block}>
          <View style={styles.chips}>
            {IDEA_FILTERS.map((label) => (
              <FilterChip
                key={label}
                label={label}
                active={ideaFilter === label}
                onPress={() => setIdeaFilter(label)}
              />
            ))}
          </View>
          {filteredIdeas.length === 0 ? (
            <EmptyState
              illustrated={ideas.length === 0}
              title={ideas.length === 0 ? 'Пока нет направлений' : 'Ничего не найдено'}
              subtitle={
                ideas.length === 0
                  ? 'Добавьте идею через «＋» — куда хочется поехать когда-нибудь.'
                  : 'Попробуйте другой запрос или фильтр.'
              }
              actionLabel={ideas.length === 0 ? 'Добавить направление' : undefined}
              onAction={
                ideas.length === 0 ? () => router.push('/form/idea') : undefined
              }
            />
          ) : (
            <View style={styles.list}>
              {filteredIdeas.map((idea) => {
                const count = placeCounts.get(idea.id) ?? 0;
                const sub =
                  idea.description?.trim() ||
                  `${ideaStatusLabel(idea.status)} · без дат`;
                return (
                  <IdeaCard
                    key={idea.id}
                    variant="full"
                    title={idea.title}
                    sub={sub}
                    countLabel={pluralPlaces(count)}
                    cover={ideaCoverForId(idea.id)}
                    metaRight={idea.status === 'converted' ? 'поездка' : 'без дат'}
                    onPress={() =>
                      router.push({
                        pathname: '/idea/[id]',
                        params: { id: String(idea.id) },
                      })
                    }
                  />
                );
              })}
            </View>
          )}
        </View>
      ) : filteredWantPlaces.length === 0 ? (
        <EmptyState
          illustrated={visitLaterPlaces.length === 0}
          title={
            visitLaterPlaces.length === 0
              ? 'Список «хочу посетить» пуст'
              : 'Ничего не найдено'
          }
          subtitle={
            visitLaterPlaces.length === 0
              ? 'Отметьте места флагом «Хочу посетить» — они появятся здесь.'
              : 'Попробуйте другой запрос.'
          }
          actionLabel={visitLaterPlaces.length === 0 ? 'Открыть места' : undefined}
          onAction={
            visitLaterPlaces.length === 0 ? () => router.push('/places') : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          {filteredWantPlaces.map((place) => (
            <PlaceRow
              key={place.id}
              name={place.name}
              city={place.city ?? ''}
              category={place.category}
              liked={place.liked}
              onPress={() =>
                router.push({
                  pathname: '/place/[id]',
                  params: { id: String(place.id) },
                })
              }
              onToggleLiked={() => {
                void (async () => {
                  await updatePlace(db, place.id, { liked: !place.liked });
                  await refresh();
                })();
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  block: {
    gap: 0,
  },
  list: {
    gap: 12,
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
