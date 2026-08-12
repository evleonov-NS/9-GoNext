import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StubScreen } from '@/components/StubScreen';
import { colors, radii } from '@/constants/theme';

export default function PlaceCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <StubScreen
      eyebrow="Карточка места"
      title={String(id ?? 'place')}
      body="Заготовка · карта / навигатор / clipboard — этап 3."
    >
      <View style={styles.card}>
        <CategoryIcon category="nature" size={56} />
        <Text style={styles.name}>Место «{id}»</Text>
        <Text style={styles.meta}>Статичный макет без SQLite</Text>
        <View style={styles.row}>
          <View style={[styles.pill, styles.pillAccent]}>
            <Text style={styles.pillAccentText}>Хочу посетить</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Понравилось</Text>
          </View>
        </View>
      </View>
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sheet,
    padding: 18,
    gap: 8,
  },
  name: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  pillAccent: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentMuted,
  },
  pillText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  pillAccentText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.accent,
  },
});
