import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { BackButton } from '@/components/chrome';
import { IconPath } from '@/components/IconPath';
import { useAppLocale } from '@/components/LocaleContext';
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
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';
import { countPlaces } from '@/repositories/placesRepository';
import { countTrips } from '@/repositories/tripsRepository';
import { getAllTripIdeas } from '@/repositories/tripIdeasRepository';
import { exportBackupAndShare } from '@/services/backup';
import { pluralIdeas, pluralPlaces, pluralTrips } from '@/utils/plural';

const THEME_OPTIONS: { id: ThemeScheme; key: 'light' | 'dark' }[] = [
  { id: 'light', key: 'light' },
  { id: 'dark', key: 'dark' },
];

const LANGUAGE_NATIVE: Record<AppLanguage, string> = {
  ru: 'Русский',
  en: 'English',
};

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { scheme, setScheme, accentId, setAccentId } = useAppTheme();
  const { language, setLanguage } = useAppLocale();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [stats, setStats] = useState(t('common.loading'));
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [places, trips, ideas] = await Promise.all([
        countPlaces(db),
        countTrips(db),
        getAllTripIdeas(db),
      ]);
      if (!cancelled) {
        setStats(
          t('settings.stats', {
            places: pluralPlaces(places),
            ideas: pluralIdeas(ideas.length),
            trips: pluralTrips(trips),
          })
        );
      }
    })().catch((e) => {
      if (!cancelled) {
        setStats(e instanceof Error ? e.message : t('common.readError'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [db, t, language]);

  const runExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportBackupAndShare(db);
    } catch (e) {
      console.error('[GoNext] backup export failed', e);
      Alert.alert(
        t('settings.exportFailed'),
        e instanceof Error ? e.message : t('alerts.error')
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View>
          <Text style={styles.eyebrow}>GoNext</Text>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>{t('settings.theme')}</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const active = scheme === option.id;
            const label = t(`settings.${option.key}`);
            return (
              <Pressable
                key={option.id}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => setScheme(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
              >
                <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {scheme === 'dark' ? (
          <Text style={styles.themeHint}>{t('settings.darkHint')}</Text>
        ) : null}

        <Text style={[styles.rowLabel, styles.colorLabel]}>{t('settings.accent')}</Text>
        <View style={styles.colorGrid}>
          {ACCENT_OPTIONS.map((option) => {
            const active = accentId === option.id;
            const label = t(`accent.${option.id}`);
            return (
              <Pressable
                key={option.id}
                style={[styles.swatch, active && styles.swatchActive]}
                onPress={() => setAccentId(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
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

        <Text style={[styles.rowLabel, styles.colorLabel]}>{t('settings.language')}</Text>
        <View style={styles.themeRow}>
          {SUPPORTED_LANGUAGES.map((id) => {
            const active = language === id;
            const label = LANGUAGE_NATIVE[id];
            return (
              <Pressable
                key={id}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => setLanguage(id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
              >
                <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>{t('settings.version')}</Text>
        <Text style={styles.rowValue}>{formatAppVersion()}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>{t('settings.data')}</Text>
        <Text style={styles.rowValue}>{stats}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>{t('settings.offline')}</Text>
        <Text style={styles.rowValue}>{t('settings.offlineHint')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>{t('settings.export')}</Text>
        <Text style={styles.rowValue}>{t('settings.exportHint')}</Text>
        <Pressable
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          onPress={() => void runExport()}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel={t('settings.exportAction')}
        >
          <Text style={styles.exportBtnText}>
            {exporting ? t('settings.exportBusy') : t('settings.exportAction')}
          </Text>
        </Pressable>
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
      fontSize: 15,
      lineHeight: 22,
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
    exportBtn: {
      marginTop: 14,
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    exportBtnDisabled: {
      opacity: 0.55,
    },
    exportBtnText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textOnAccent,
    },
  });
}
