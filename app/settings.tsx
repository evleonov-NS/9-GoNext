import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { BackButton } from '@/components/chrome';
import { IconPath } from '@/components/IconPath';
import { Screen } from '@/components/Screen';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { formatAppVersion } from '@/constants/version';
import {
  ACCENT_OPTIONS,
  contrastOn,
  radii,
  type AppColors,
  type ThemeScheme,
} from '@/constants/theme';
import { countPlaces } from '@/repositories/placesRepository';
import { countTrips } from '@/repositories/tripsRepository';
import { getAllTripIdeas } from '@/repositories/tripIdeasRepository';

const THEME_OPTIONS: { id: ThemeScheme; label: string }[] = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { scheme, setScheme, accentId, setAccentId } = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
        <Text style={styles.rowLabel}>Тема</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const active = scheme === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => setScheme(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
              >
                <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {scheme === 'dark' ? (
          <Text style={styles.themeHint}>В тёмной теме фоновое изображение скрыто.</Text>
        ) : null}

        <Text style={[styles.rowLabel, styles.colorLabel]}>Основной цвет</Text>
        <View style={styles.colorGrid}>
          {ACCENT_OPTIONS.map((option) => {
            const active = accentId === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.swatch, active && styles.swatchActive]}
                onPress={() => setAccentId(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
              >
                <View style={[styles.swatchFill, { backgroundColor: option.seed }]}>
                  {active ? (
                    <IconPath
                      d="M5 13l4 4L19 7"
                      size={16}
                      color={contrastOn(option.seed)}
                      strokeWidth={2.4}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
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
    themeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    themeOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    themeOptionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    themeOptionTextActive: {
      color: colors.textOnAccent,
    },
    themeHint: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    colorLabel: {
      marginTop: 18,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    swatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      padding: 2,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchActive: {
      borderColor: colors.text,
    },
    swatchFill: {
      flex: 1,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
