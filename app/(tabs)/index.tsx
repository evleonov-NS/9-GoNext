import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ActiveTripCard, IdeaCard, PlaceRow } from '@/components/cards';
import { SettingsButton } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { PageTitle, SectionHeader } from '@/components/ui';
import { useAddSheet } from '@/components/AddSheetContext';
import { colors, radii } from '@/constants/theme';

function formatToday() {
  return new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

/** Статичный макет Главной — структура как в прототипе (без БД). */
export default function HomeScreen() {
  const router = useRouter();
  const { open } = useAddSheet();

  return (
    <Screen tabBarPadding>
      <PageTitle
        eyebrow={`GoNext · ${formatToday()}`}
        title="Куда дальше?"
        right={<SettingsButton onPress={() => router.push('/settings')} />}
      />

      <View style={styles.hint}>
        <Text style={styles.hintEyebrow}>СЕГОДНЯ НАЧИНАЕТСЯ</Text>
        <Text style={styles.hintTitle}>Выборг на выходные</Text>
        <Text style={styles.hintSub}>
          12–14 сен · 4 места. Начать поездку?
        </Text>
        <View style={styles.hintRow}>
          <View style={styles.hintPrimary}>
            <Text style={styles.hintPrimaryText}>Начать поездку</Text>
          </View>
          <View style={styles.hintLater}>
            <Text style={styles.hintLaterText}>Позже</Text>
          </View>
        </View>
      </View>

      <View style={styles.gap12}>
        <ActiveTripCard
          dayLabel="День 2"
          title="Карелия"
          nextName="Кивач"
          leftAfter={3}
          visited={2}
          left={4}
          dates="10–16 авг"
          onNext={() => router.push('/next')}
          onOpenTrip={() =>
            router.push({ pathname: '/trip/[id]', params: { id: 'karelia' } })
          }
        />
      </View>

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
            onPress={() =>
              router.push({ pathname: '/idea/[id]', params: { id: 'altai' } })
            }
          />
          <IdeaCard
            title="Стамбул"
            sub="Город на два континента · 6 мест"
            countLabel="6 мест"
            cover={['#8b5a2b', '#d9ab7c']}
            onPress={() =>
              router.push({ pathname: '/idea/[id]', params: { id: 'istanbul' } })
            }
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
            onPress={() =>
              router.push({ pathname: '/place/[id]', params: { id: 'monrepo' } })
            }
          />
          <PlaceRow
            name="Рускеала"
            city="Карелия"
            category="nature"
            onPress={() =>
              router.push({ pathname: '/place/[id]', params: { id: 'ruskeala' } })
            }
          />
        </View>
      </View>

      <View style={styles.demoNote}>
        <Text style={styles.demoNoteText}>
          Каркас UI · данные статичны · нажмите + чтобы открыть «Что добавить?»
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
    backgroundColor: colors.hintBg,
    borderWidth: 1,
    borderColor: colors.hintBorder,
    borderRadius: radii.xxl,
    padding: 16,
    marginBottom: 12,
  },
  hintEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.hintAccent,
  },
  hintTitle: {
    marginTop: 9,
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  hintSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.hintText,
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
    borderColor: colors.hintChip,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  hintLaterText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.hintText,
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
