import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';
import { IdeaCard, PlaceRow } from '@/components/cards';
import { EmptyState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle } from '@/components/ui';
import {
  ideaCoverForId,
  ideaStatusLabel,
} from '@/constants/priorities';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { useTripIdeas } from '@/hooks/useTripIdeas';
import { updatePlace } from '@/repositories/placesRepository';
import { useSQLiteContext } from 'expo-sqlite';
import { textMatchesQuery } from '@/utils/keyboardLayout';
import { pluralPlaces } from '@/utils/plural';

const WANT_TABS = ['ideas', 'places'] as const;
const IDEA_FILTERS = ['active', 'all', 'archived'] as const;

export default function WantScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { ideas, placeCounts, visitLaterPlaces, loading, error, refresh } = useTripIdeas();
  const [tab, setTab] = useState<(typeof WANT_TABS)[number]>('ideas');
  const [ideaFilter, setIdeaFilter] = useState<(typeof IDEA_FILTERS)[number]>('active');
  const [search, setSearch] = useState('');

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (ideaFilter === 'active' && idea.status !== 'active') return false;
      if (ideaFilter === 'archived' && idea.status !== 'archived') return false;
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
      <PageTitle eyebrow={t('want.eyebrow')} title={t('want.title')} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('want.search')}
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <View style={styles.chips}>
        {WANT_TABS.map((id) => (
          <FilterChip
            key={id}
            label={t(`want.tabs.${id}`)}
            active={tab === id}
            onPress={() => setTab(id)}
          />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : tab === 'ideas' ? (
        <View style={styles.block}>
          <View style={styles.chips}>
            {IDEA_FILTERS.map((id) => (
              <FilterChip
                key={id}
                label={t(`want.filters.${id}`)}
                active={ideaFilter === id}
                onPress={() => setIdeaFilter(id)}
              />
            ))}
          </View>
          {filteredIdeas.length === 0 ? (
            <EmptyState
              illustrated={ideas.length === 0}
              title={ideas.length === 0 ? t('want.emptyIdeasTitle') : t('want.notFoundTitle')}
              subtitle={
                ideas.length === 0 ? t('want.emptyIdeasSub') : t('want.notFoundIdeasSub')
              }
              actionLabel={ideas.length === 0 ? t('want.emptyIdeasAction') : undefined}
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
                  t('want.statusNoDates', { status: ideaStatusLabel(idea.status) });
                return (
                  <IdeaCard
                    key={idea.id}
                    variant="full"
                    title={idea.title}
                    sub={sub}
                    countLabel={pluralPlaces(count)}
                    cover={ideaCoverForId(idea.id)}
                    metaRight={
                      idea.status === 'converted' ? t('ideaCard.asTrip') : t('ideaCard.noDates')
                    }
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
              ? t('want.emptyWantTitle')
              : t('want.notFoundTitle')
          }
          subtitle={
            visitLaterPlaces.length === 0
              ? t('want.emptyWantSub')
              : t('want.notFoundPlacesSub')
          }
          actionLabel={visitLaterPlaces.length === 0 ? t('want.emptyWantAction') : undefined}
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
    color: colors.dangerText,
    fontWeight: '600',
  },
  });
}
