import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PlaceRow } from '@/components/cards';
import { StubScreen } from '@/components/StubScreen';
import { colors, radii } from '@/constants/theme';

export default function TripCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <StubScreen
      eyebrow="Поездка"
      title={String(id ?? 'trip')}
      body="Заготовка · дни, порядок, статусы TripPlace — этап 5."
    >
      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={() => router.push('/next')}>
          <Text style={styles.primaryText}>Следующее место</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/diary')}>
          <Text style={styles.secondaryText}>Дневник</Text>
        </Pressable>
      </View>
      <Text style={styles.day}>День 1</Text>
      <View style={styles.list}>
        <PlaceRow name="Выборгский замок" city="Выборг" category="sight" />
        <PlaceRow name="Парк Монрепо" city="Выборг" category="walk" />
      </View>
      <Text style={[styles.day, { marginTop: 16 }]}>Без дня</Text>
      <PlaceRow name="Кафе на набережной" city="Выборг" category="food" />
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },
  primary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: {
    fontWeight: '800',
    color: colors.text,
  },
  day: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  list: {
    gap: 9,
  },
});
