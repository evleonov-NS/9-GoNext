import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PlaceRow } from '@/components/cards';
import { StubScreen } from '@/components/StubScreen';
import { colors, radii } from '@/constants/theme';

export default function IdeaCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <StubScreen
      eyebrow="Идея поездки"
      title={String(id ?? 'idea')}
      body="Заготовка · места идеи через placeId — этап 4."
    >
      <View style={styles.actions}>
        <View style={styles.primary}>
          <Text style={styles.primaryText}>Создать поездку</Text>
        </View>
        <Pressable style={styles.secondary} onPress={() => router.push('/picker')}>
          <Text style={styles.secondaryText}>Добавить места</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        <PlaceRow name="Место 1" city="Демо" category="sight" />
        <PlaceRow name="Место 2" city="Демо" category="food" />
      </View>
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 9,
    marginBottom: 16,
  },
  primary: {
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
  list: {
    gap: 9,
  },
});
