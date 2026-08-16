import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActiveTripCard,
  IdeaCard,
  PlaceRow,
  PlannedTripCard,
} from '@/components/cards';
import { EmptyState, SettingsButton } from '@/components/chrome';
import { GlassView } from '@/components/GlassView';
import { Screen } from '@/components/Screen';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { PageTitle, SectionHeader } from '@/components/ui';
import { useAddSheet } from '@/components/AddSheetContext';
import { ideaCoverForId } from '@/constants/priorities';
import { radii, type AppColors } from '@/constants/theme';
import { addDays, toDateOnly } from '@/database/helpers';
import { useHomeTrips } from '@/hooks/useHomeTrips';
import type { Trip, TripIdea } from '@/types';
import {
  heroContentOverlap,
  SCREEN_PAD_TOP,
  useHeroHeight,
} from '@/utils/heroLayout';
import { openPlaceOnMap } from '@/utils/maps';
import { pluralPlaces } from '@/utils/plural';
import { formatTripDates } from '@/utils/tripLabels';
import { tripDurationDays, todayDateOnly } from '@/utils/tripDates';

function formatToday() {
  return new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function dayLabelForActive(trip: Trip): string {
  if (!trip.startDate || !trip.endDate) return 'в пути';
  const duration = tripDurationDays(trip.startDate, trip.endDate);
  if (!duration) return 'в пути';
  const today = todayDateOnly();
  const startParts = trip.startDate.split('-').map(Number);
  const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  let day = 1;
  for (let i = 0; i < duration; i++) {
    const d = toDateOnly(addDays(start, i));
    if (d === today) {
      day = i + 1;
      break;
    }
    if (d < today) day = i + 1;
  }
  return `День ${day}`;
}

function ideaHomeSub(idea: TripIdea): string {
  const line = idea.description?.trim().split('\n')[0]?.trim() ?? '';
  if (!line) return 'Идея поездки';
  return line.length > 56 ? `${line.slice(0, 54)}…` : line;
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

/** Главная: что сейчас важно — active / planned / empty, идеи, want-места. */
export default function HomeScreen() {
  const router = useRouter();
  const { open } = useAddSheet();
  const insets = useSafeAreaInsets();
  const heroHeight = useHeroHeight();
  const { showArtwork } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
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
    dismissBanner,
    startBannerTrip,
  } = useHomeTrips();

  const [onHeroHeight, setOnHeroHeight] = useState(0);
  const onHeroLayout = (e: LayoutChangeEvent) => {
    setOnHeroHeight(e.nativeEvent.layout.height);
  };

  /** Карточка под hero начинается на границе растворения, а не после стыка. */
  const heroSpacer = showArtwork
    ? Math.max(
        12,
        heroHeight -
          heroContentOverlap(heroHeight) -
          (SCREEN_PAD_TOP + insets.top + onHeroHeight)
      )
    : 8;

  const runBannerStart = async (completePrevious?: boolean) => {
    if (!bannerTrip) return;
    const result = await startBannerTrip({ completePrevious });
    if (result.ok) {
      router.push({ pathname: '/trip/[id]', params: { id: String(result.trip.id) } });
      return;
    }
    if (result.reason === 'need_dates') {
      router.push({
        pathname: '/form/trip',
        params: { id: String(bannerTrip.id), focusDates: '1' },
      });
      return;
    }
    if (result.reason === 'active_conflict') {
      confirmStartConflict(result.activeTrip, bannerTrip.title, () => {
        void runBannerStart(true);
      });
    }
  };

  const showEmptyHero = !loading && !active && !nextPlanned;

  return (
    <Screen tabBarPadding hero>
      <View onLayout={onHeroLayout}>
        <PageTitle
          tone="onHero"
          eyebrow={`GoNext · ${formatToday()}`}
          title="Куда дальше?"
          right={
            <SettingsButton
              variant={showArtwork ? 'glass' : 'solid'}
              onPress={() => router.push('/settings')}
            />
          }
        />

        {bannerTrip ? (
          <GlassView style={styles.hint}>
            <Text style={styles.hintEyebrow}>СЕГОДНЯ НАЧИНАЕТСЯ</Text>
            <Text style={styles.hintTitle}>{bannerTrip.title}</Text>
            <Text style={styles.hintSub}>
              {formatTripDates(bannerTrip.startDate, bannerTrip.endDate)}. Начать
              поездку?
            </Text>
            <View style={styles.hintRow}>
              <Pressable
                style={styles.hintPrimary}
                onPress={() => void runBannerStart()}
              >
                <Text style={styles.hintPrimaryText}>Начать поездку</Text>
              </Pressable>
              <Pressable style={styles.hintLater} onPress={dismissBanner}>
                <Text style={styles.hintLaterText}>Позже</Text>
              </Pressable>
            </View>
          </GlassView>
        ) : null}
      </View>

      <View style={{ height: heroSpacer }} />

      {active ? (
        <View style={styles.gap12}>
          <ActiveTripCard
            dayLabel={dayLabelForActive(active)}
            title={active.title}
            nextName={nextPlaceName ?? 'все места пройдены'}
            leftAfter={Math.max(0, activePending - (nextPlaceName ? 1 : 0))}
            visited={activeVisited}
            left={activePending}
            dates={formatTripDates(active.startDate, active.endDate)}
            onNext={() => router.push('/next')}
            onNavigator={() => {
              if (!nextPlace) return;
              void openPlaceOnMap({
                name: nextPlace.name,
                latitude: nextPlace.latitude,
                longitude: nextPlace.longitude,
              }).catch((e) => {
                console.error(e);
                Alert.alert('Не удалось открыть карту');
              });
            }}
            onOpenTrip={() =>
              router.push({
                pathname: '/trip/[id]',
                params: { id: String(active.id) },
              })
            }
          />
        </View>
      ) : nextPlanned ? (
        <View style={styles.gap12}>
          <PlannedTripCard
            title={nextPlanned.title}
            dates={formatTripDates(nextPlanned.startDate, nextPlanned.endDate)}
            countLabel={pluralPlaces(nextPlannedPlaceCount)}
            onOpen={() =>
              router.push({
                pathname: '/trip/[id]',
                params: { id: String(nextPlanned.id) },
              })
            }
          />
        </View>
      ) : showEmptyHero ? (
        <View style={styles.gap12}>
          <EmptyState
            title="Куда хочется поехать?"
            subtitle="Сохраните идею будущего путешествия."
            actionLabel="Добавить"
            onAction={open}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Куда хочу поехать"
          actionLabel="Все"
          onAction={() => router.push('/want')}
        />
        {ideas.length === 0 ? (
          <Text style={styles.sectionEmpty}>
            Пока нет направлений.{' '}
            <Text style={styles.sectionEmptyLink} onPress={() => router.push('/form/idea')}>
              Добавить идею
            </Text>
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {ideas.map((idea) => {
              const count = ideaPlaceCounts.get(idea.id) ?? 0;
              return (
                <IdeaCard
                  key={idea.id}
                  title={idea.title}
                  sub={ideaHomeSub(idea)}
                  countLabel={pluralPlaces(count)}
                  cover={ideaCoverForId(idea.id)}
                  onPress={() =>
                    router.push({
                      pathname: '/idea/[id]',
                      params: { id: String(idea.id) },
                    })
                  }
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Что хочу посетить"
          actionLabel="Все"
          onAction={() => router.push('/places')}
        />
        {wantPlaces.length === 0 ? (
          <Text style={styles.sectionEmpty}>
            Отметьте места флагом «Хочу посетить».{' '}
            <Text style={styles.sectionEmptyLink} onPress={() => router.push('/places')}>
              Открыть места
            </Text>
          </Text>
        ) : (
          <View style={styles.list}>
            {wantPlaces.map((place) => (
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
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  hint: {
    borderRadius: radii.xxl,
    padding: 16,
    marginBottom: 12,
  },
  hintEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.onHeroEyebrow,
  },
  hintTitle: {
    marginTop: 9,
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.onHeroText,
  },
  hintSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.onHeroEyebrow,
  },
  hintRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  hintPrimary: {
    flex: 1,
    backgroundColor: colors.hintButton,
    borderRadius: radii.sm,
    paddingVertical: 13,
    alignItems: 'center',
  },
  hintPrimaryText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  hintLater: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.glassBg,
  },
  hintLaterText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.onHeroText,
  },
  gap12: {
    marginBottom: 4,
  },
  section: {
    marginTop: 26,
  },
  hScroll: {
    gap: 11,
    paddingBottom: 4,
  },
  list: {
    gap: 10,
  },
  sectionEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  sectionEmptyLink: {
    fontWeight: '700',
    color: colors.accent,
  },
  });
}
