import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BackButton, EmptyState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { getAllPlaces } from '@/repositories/placesRepository';
import {
  addTripIdeaPlacesBulk,
  getTripIdeaById,
  getTripIdeaPlaceIds,
} from '@/repositories/tripIdeasRepository';
import {
  addTripPlacesBulk,
  getTripById,
  getTripPlaceIds,
} from '@/repositories/tripsRepository';
import type { Place } from '@/types';
import { textMatchesQuery } from '@/utils/keyboardLayout';

export default function PickerScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ mode?: string; ideaId?: string; tripId?: string }>();
  const mode = params.mode === 'trip' ? 'trip' : 'idea';
  const ideaId = params.ideaId ? Number(params.ideaId) : null;
  const tripId = params.tripId ? Number(params.tripId) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [targetLabel, setTargetLabel] = useState(() => t('picker.intoList'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'idea') {
        if (ideaId == null || !Number.isFinite(ideaId)) {
          Alert.alert(t('alerts.noIdeaTitle'), t('alerts.noIdeaBody'));
          router.back();
          return;
        }
        const idea = await getTripIdeaById(db, ideaId);
        setTargetLabel(idea ? t('picker.intoIdeaNamed', { title: idea.title }) : t('picker.intoIdea'));
        const [all, taken] = await Promise.all([
          getAllPlaces(db),
          getTripIdeaPlaceIds(db, ideaId),
        ]);
        setPlaces(all);
        setExcluded(taken);
        setSelected(new Set());
      } else {
        if (tripId == null || !Number.isFinite(tripId)) {
          Alert.alert(t('alerts.noTripTitle'), t('alerts.noTripBody'));
          router.back();
          return;
        }
        const trip = await getTripById(db, tripId);
        setTargetLabel(trip ? t('picker.intoTripNamed', { title: trip.title }) : t('picker.intoTrip'));
        const [all, taken] = await Promise.all([
          getAllPlaces(db),
          getTripPlaceIds(db, tripId),
        ]);
        setPlaces(all);
        setExcluded(taken);
        setSelected(new Set());
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('alerts.error'), e instanceof Error ? e.message : t('alerts.loadPlacesFailed'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [db, ideaId, mode, router, t, tripId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const available = useMemo(
    () => places.filter((p) => !excluded.has(p.id)),
    [places, excluded]
  );

  const filtered = useMemo(
    () =>
      available.filter((p) => textMatchesQuery(`${p.name} ${p.city ?? ''}`, search)),
    [available, search]
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onConfirm = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      if (mode === 'idea') {
        if (ideaId == null) return;
        const n = await addTripIdeaPlacesBulk(db, ideaId, [...selected]);
        if (n === 0) {
          Alert.alert(t('alerts.alreadyAdded'), t('alerts.alreadyInIdea'));
        }
      } else {
        if (tripId == null) return;
        const n = await addTripPlacesBulk(db, tripId, [...selected]);
        if (n === 0) {
          Alert.alert(t('alerts.alreadyAdded'), t('alerts.alreadyInTrip'));
        }
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert(t('alerts.error'), e instanceof Error ? e.message : t('alerts.addFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{targetLabel}</Text>
          <Text style={styles.title}>{t('picker.title')}</Text>
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('picker.search')}
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {available.length === 0 ? (
        <EmptyState
          title={t('picker.allAddedTitle')}
          subtitle={t('picker.allAddedSub')}
          actionLabel={t('picker.createPlace')}
          onAction={() => router.push('/form/place')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('picker.notFoundTitle')}
          subtitle={t('picker.notFoundSub')}
          actionLabel={t('picker.createPlace')}
          onAction={() => router.push('/form/place')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((place) => {
            const on = selected.has(place.id);
            const sub = place.city
              ? `${place.city} · ${t(`categoryShort.${place.category}`)}`
              : t(`categoryShort.${place.category}`);
            return (
              <Pressable
                key={place.id}
                style={[styles.row, on && styles.rowOn]}
                onPress={() => toggle(place.id)}
              >
                <CategoryIcon category={place.category} size={44} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{place.name}</Text>
                  <Text style={styles.meta}>{sub}</Text>
                </View>
                <View style={[styles.check, on && styles.checkOn]}>
                  <Text style={styles.checkMark}>{on ? '✓' : ''}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        style={styles.createLink}
        onPress={() => router.push('/form/place')}
      >
        <Text style={styles.createLinkText}>{t('picker.createLink')}</Text>
      </Pressable>

      <Pressable
        style={[styles.submit, (selected.size === 0 || saving) && styles.submitDisabled]}
        disabled={selected.size === 0 || saving}
        onPress={() => void onConfirm()}
      >
        <Text style={styles.submitText}>
          {saving
            ? t('picker.adding')
            : selected.size === 0
              ? t('picker.choose')
              : t('picker.addCount', { count: selected.size })}
        </Text>
      </Pressable>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  title: {
    marginTop: 3,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  list: {
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 13,
  },
  rowOn: {
    borderColor: colors.accent,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: {
    color: colors.textOnAccent,
    fontWeight: '800',
    fontSize: 13,
  },
  createLink: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createLinkText: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.textSecondary,
  },
  submit: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.textOnAccent,
  },
  });
}
