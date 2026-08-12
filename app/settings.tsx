import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BackButton } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { formatAppVersion } from '@/constants/version';
import { colors, radii } from '@/constants/theme';
import { countPlaces } from '@/repositories/placesRepository';
import { countTrips } from '@/repositories/tripsRepository';
import { getAllTripIdeas } from '@/repositories/tripIdeasRepository';

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [stats, setStats] = useState('загрузка…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [places, trips, ideas] = await Promise.all([
        countPlaces(db),
        countTrips(db),
        getAllTripIdeas(db),
      ]);
      if (!cancelled) {
        setStats(`${places} мест · ${ideas.length} идей · ${trips} поездок`);
      }
    })().catch((e) => {
      if (!cancelled) {
        setStats(e instanceof Error ? e.message : 'ошибка чтения');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View>
          <Text style={styles.eyebrow}>GoNext</Text>
          <Text style={styles.title}>Настройки</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>Версия</Text>
        <Text style={styles.rowValue}>{formatAppVersion()}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Данные (SQLite)</Text>
        <Text style={styles.rowValue}>{stats}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>Экспорт</Text>
        <Text style={styles.rowValue}>Заготовка · этап 10</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  title: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 16,
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },
  rowValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
