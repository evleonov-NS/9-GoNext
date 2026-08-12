import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { StubScreen } from '@/components/StubScreen';
import { LinearGradientPlaceholder } from '@/components/LinearGradientPlaceholder';
import { colors, radii } from '@/constants/theme';

export default function NextScreen() {
  return (
    <StubScreen
      eyebrow="Карелия"
      title="Следующее место"
      body="Заготовка экрана next · логика очереди — этап 7."
    >
      <View style={styles.card}>
        <LinearGradientPlaceholder
          colors={['#3a6b4d', '#9dc3aa']}
          style={styles.cover}
        />
        <View style={styles.body}>
          <Text style={styles.name}>Водопад Кивач</Text>
          <Text style={styles.meta}>Карелия · Природа</Text>
          <View style={styles.actions}>
            <View style={styles.primary}>
              <Text style={styles.primaryText}>Посещено</Text>
            </View>
            <View style={styles.secondary}>
              <Text style={styles.secondaryText}>Пропустить</Text>
            </View>
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
    borderRadius: 30,
    overflow: 'hidden',
  },
  cover: {
    height: 160,
  },
  body: {
    padding: 18,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
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
});
