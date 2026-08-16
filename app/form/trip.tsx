import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { BackButton } from '@/components/chrome';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { getTripIdeaById, getTripIdeaPlaces } from '@/repositories/tripIdeasRepository';
import {
  clearTripPlaceDaysBeyond,
  createTrip,
  deleteTrip,
  getTripById,
  updateTrip,
} from '@/repositories/tripsRepository';
import { convertIdeaToTrip } from '@/services/convertIdeaToTrip';
import { pluralPlaces } from '@/utils/plural';
import { tripDurationDays } from '@/utils/tripDates';

export default function FormTripScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{
    id?: string;
    focusDates?: string;
    ideaId?: string;
  }>();
  const editId = params.id ? Number(params.id) : null;
  const ideaId = params.ideaId ? Number(params.ideaId) : null;
  const isEdit = editId != null && Number.isFinite(editId);
  const fromIdea = !isEdit && ideaId != null && Number.isFinite(ideaId);
  const focusDates = params.focusDates === '1';

  const [loading, setLoading] = useState(isEdit || fromIdea);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [ideaPlaceCount, setIdeaPlaceCount] = useState(0);
  const [ideaAlreadyConverted, setIdeaAlreadyConverted] = useState(false);

  useEffect(() => {
    if (isEdit && editId != null) {
      let cancelled = false;
      (async () => {
        try {
          const trip = await getTripById(db, editId);
          if (cancelled) return;
          if (!trip) {
            Alert.alert(t('alerts.tripNotFound'));
            router.back();
            return;
          }
          setTitle(trip.title);
          setDescription(trip.description ?? '');
          setStartDate(trip.startDate);
          setEndDate(trip.endDate);
        } catch (e) {
          console.error(e);
          Alert.alert(t('alerts.loadTripFailed'));
          router.back();
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (fromIdea && ideaId != null) {
      let cancelled = false;
      (async () => {
        try {
          const idea = await getTripIdeaById(db, ideaId);
          if (cancelled) return;
          if (!idea) {
            Alert.alert(t('alerts.ideaNotFound'));
            router.back();
            return;
          }
          setTitle(idea.title);
          setDescription(idea.description ?? '');
          setIdeaAlreadyConverted(idea.status === 'converted');
          const links = await getTripIdeaPlaces(db, ideaId);
          if (!cancelled) setIdeaPlaceCount(links.length);
        } catch (e) {
          console.error(e);
          Alert.alert(t('alerts.loadIdeaFailed'));
          router.back();
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    return undefined;
  }, [db, editId, fromIdea, ideaId, isEdit, router]);

  const onSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert(t('alerts.needName'), t('alerts.needTripName'));
      return;
    }

    const start = startDate;
    const end = endDate;
    if ((start && !end) || (!start && end)) {
      Alert.alert(t('alerts.dates'), t('alerts.datesBothOrNone'));
      return;
    }
    if (start && end && start > end) {
      Alert.alert(t('alerts.dates'), t('alerts.datesOrder'));
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editId != null) {
        const next = await updateTrip(db, editId, {
          title: trimmed,
          description: description.trim() || null,
          startDate: start,
          endDate: end,
        });
        const duration = tripDurationDays(next.startDate, next.endDate);
        if (duration != null) {
          const cleared = await clearTripPlaceDaysBeyond(db, editId, duration);
          if (cleared > 0) {
            Alert.alert(
              t('alerts.daysAdjustedTitle'),
              t('alerts.daysAdjustedBody', { count: cleared })
            );
          }
        }
        router.replace({ pathname: '/trip/[id]', params: { id: String(editId) } });
      } else if (fromIdea && ideaId != null) {
        const trip = await convertIdeaToTrip(db, ideaId, {
          title: trimmed,
          description: description.trim() || null,
          startDate: start,
          endDate: end,
        });
        router.replace({ pathname: '/trip/[id]', params: { id: String(trip.id) } });
      } else {
        const trip = await createTrip(db, {
          title: trimmed,
          description: description.trim() || null,
          startDate: start,
          endDate: end,
          status: 'planned',
          current: false,
        });
        router.replace({ pathname: '/trip/[id]', params: { id: String(trip.id) } });
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('alerts.error'), e instanceof Error ? e.message : t('alerts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!isEdit || editId == null) return;
    Alert.alert(
      t('alerts.deleteTripTitle'),
      t('alerts.deleteTripBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTrip(db, editId);
                router.replace('/trips');
              } catch (e) {
                console.error(e);
                Alert.alert(t('alerts.error'), e instanceof Error ? e.message : t('alerts.deleteFailed'));
              }
            })();
          },
        },
      ]
    );
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
        <Text style={styles.title}>
          {isEdit
            ? t('form.edit')
            : fromIdea
              ? t('form.tripFromIdea')
              : t('form.newTrip')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('form.name')}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('form.tripTitlePh')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('form.descriptionOptional')}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('form.tripDescPh')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.area]}
          multiline
          textAlignVertical="top"
        />

        <DateField
          label={t('form.startDate')}
          value={startDate}
          onChange={setStartDate}
          focused={focusDates}
          autoFocus={focusDates}
        />

        <DateField
          label={t('form.endDate')}
          value={endDate}
          onChange={setEndDate}
        />

        {fromIdea ? (
          <Text style={styles.ideaHint}>
            {t('form.ideaHint', { places: pluralPlaces(ideaPlaceCount) })}
            {ideaAlreadyConverted ? t('form.ideaHintAgain') : ''}
          </Text>
        ) : null}

        <Text style={styles.hint}>
          {t('form.datesHint')}
        </Text>

        <Pressable
          style={[styles.submit, saving && styles.submitDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          <Text style={styles.submitText}>
            {saving ? t('common.saving') : isEdit ? t('common.save') : t('form.createTrip')}
          </Text>
        </Pressable>

        {isEdit ? (
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>{t('form.deleteTrip')}</Text>
          </Pressable>
        ) : null}
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
    marginBottom: 18,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 18,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  area: {
    minHeight: 88,
    paddingTop: 14,
  },
  ideaHint: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.text,
  },
  hint: {
    marginTop: -4,
    marginBottom: 14,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  submit: {
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.textOnAccent,
  },
  deleteBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    fontWeight: '800',
    color: colors.dangerText,
  },
  });
}
