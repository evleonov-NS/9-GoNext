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
import { ActiveTripCard, IdeaCard, PlaceRow } from '@/components/cards';
import { SettingsButton } from '@/components/chrome';
import { GlassView } from '@/components/GlassView';
import { Screen } from '@/components/Screen';
import { PageTitle, SectionHeader } from '@/components/ui';
import { useAddSheet } from '@/components/AddSheetContext';
import { colors, radii } from '@/constants/theme';
import { addDays, toDateOnly } from '@/database/helpers';
import { useHomeTrips } from '@/hooks/useHomeTrips';
import type { Trip } from '@/types';
import {
  heroContentOverlap,
  SCREEN_PAD_TOP,
  useHeroHeight,
} from '@/utils/heroLayout';
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

/** Главная: баннер старта и активная поездка — живые; идеи/want — статичны до этапа 9. */
export default function HomeScreen() {
  const router = useRouter();
  const { open } = useAddSheet();
  const insets = useSafeAreaInsets();
  const heroHeight = useHeroHeight();
  const {
    active,
    activePending,
    activeVisited,
    nextPlaceName,
    bannerTrip,
    dismissBanner,
    startBannerTrip,
  } = useHomeTrips();

  const [onHeroHeight, setOnHeroHeight] = useState(0);
  const onHeroLayout = (e: LayoutChangeEvent) => {
    setOnHeroHeight(e.nativeEvent.layout.height);
  };

  /** Карточка под hero начинается на границе растворения, а не после стыка. */
  const heroSpacer = Math.max(
    12,
    heroHeight -
      heroContentOverlap(heroHeight) -
      (SCREEN_PAD_TOP + insets.top + onHeroHeight)
  );

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

  return (
    <Screen tabBarPadding hero>
      <View onLayout={onHeroLayout}>
        <PageTitle
          tone="onHero"
          eyebrow={`GoNext · ${formatToday()}`}
          title="Куда дальше?"
          right={<SettingsButton variant="glass" onPress={() => router.push('/settings')} />}
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
            nextName={nextPlaceName ?? 'нет pending'}
            leftAfter={Math.max(0, activePending - (nextPlaceName ? 1 : 0))}
            visited={activeVisited}
            left={activePending}
            dates={formatTripDates(active.startDate, active.endDate)}
            onNext={() => router.push('/next')}
            onOpenTrip={() =>
              router.push({
                pathname: '/trip/[id]',
                params: { id: String(active.id) },
              })
            }
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Куда хочу поехать"
          actionLabel="Все"
          onAction={() => router.push('/want')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          <IdeaCard
            title="Алтай"
            sub="Горы и озёра · 5 мест"
            countLabel="5 мест"
            cover={['#3a6b4d', '#9dc3aa']}
            onPress={() => router.push('/want')}
          />
          <IdeaCard
            title="Стамбул"
            sub="Город на два континента · 6 мест"
            countLabel="6 мест"
            cover={['#8b5a2b', '#d9ab7c']}
            onPress={() => router.push('/want')}
          />
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Что хочу посетить"
          actionLabel="Все"
          onAction={() => router.push('/places')}
        />
        <View style={styles.list}>
          <PlaceRow
            name="Парк Монрепо"
            city="Выборг"
            category="walk"
            onPress={() => router.push('/places')}
          />
          <PlaceRow
            name="Рускеала"
            city="Карелия"
            category="nature"
            onPress={() => router.push('/places')}
          />
        </View>
      </View>

      <View style={styles.demoNote}>
        <Text style={styles.demoNoteText}>
          Этап 5: баннер старта и активная поездка — из БД. Блоки идей и «хочу»
          на Главной оживут на этапе 9.
        </Text>
        <Text style={styles.demoLink} onPress={open}>
          Открыть sheet
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  demoNote: {
    marginTop: 28,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  demoNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  demoLink: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
});
