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
import { Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BackButton, EmptyState } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { PLACE_CATEGORIES } from '@/constants/categories';
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
  const [targetLabel, setTargetLabel] = useState('В список');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'idea') {
        if (ideaId == null || !Number.isFinite(ideaId)) {
          Alert.alert('Нет идеи', 'Откройте picker из карточки идеи.');
          router.back();
          return;
        }
        const idea = await getTripIdeaById(db, ideaId);
        setTargetLabel(idea ? `В идею «${idea.title}»` : 'В идею');
        const [all, taken] = await Promise.all([
          getAllPlaces(db),
          getTripIdeaPlaceIds(db, ideaId),
        ]);
        setPlaces(all);
        setExcluded(taken);
        setSelected(new Set());
      } else {
        if (tripId == null || !Number.isFinite(tripId)) {
          Alert.alert('Нет поездки', 'Откройте picker из карточки поездки.');
          router.back();
          return;
        }
        const trip = await getTripById(db, tripId);
        setTargetLabel(trip ? `В поездку «${trip.title}»` : 'В поездку');
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
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось загрузить места');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [db, ideaId, mode, router, tripId]);

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
          Alert.alert('Уже добавлено', 'Выбранные места уже есть в идее.');
        }
      } else {
        if (tripId == null) return;
        const n = await addTripPlacesBulk(db, tripId, [...selected]);
        if (n === 0) {
          Alert.alert('Уже добавлено', 'Выбранные места уже есть в поездке.');
        }
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось добавить');
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
          <Text style={styles.title}>Выбрать места</Text>
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Поиск по местам"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {available.length === 0 ? (
        <EmptyState
          title="Все места уже добавлены"
          subtitle="Создайте новое место — оно появится и в общей базе."
          actionLabel="Создать новое место"
          onAction={() => router.push('/form/place')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          subtitle="Попробуйте другой запрос или создайте новое место."
          actionLabel="Создать новое место"
          onAction={() => router.push('/form/place')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((place) => {
            const on = selected.has(place.id);
            const cat = PLACE_CATEGORIES[place.category];
            const sub = place.city
              ? `${place.city} · ${cat.shortLabel}`
              : cat.shortLabel;
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
        <Text style={styles.createLinkText}>+ Создать новое место</Text>
      </Pressable>

      <Pressable
        style={[styles.submit, (selected.size === 0 || saving) && styles.submitDisabled]}
        disabled={selected.size === 0 || saving}
        onPress={() => void onConfirm()}
      >
        <Text style={styles.submitText}>
          {saving
            ? 'Добавляем…'
            : selected.size === 0
              ? 'Выберите места'
              : `Добавить ${selected.size}`}
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
    borderColor: '#d3d5cc',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createLinkText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#5c5f57',
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
