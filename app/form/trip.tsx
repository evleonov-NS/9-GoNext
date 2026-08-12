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
import { Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { BackButton } from '@/components/chrome';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { colors, radii } from '@/constants/theme';
import {
  clearTripPlaceDaysBeyond,
  createTrip,
  deleteTrip,
  getTripById,
  updateTrip,
} from '@/repositories/tripsRepository';
import { tripDurationDays } from '@/utils/tripDates';

export default function FormTripScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id?: string; focusDates?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEdit = editId != null && Number.isFinite(editId);
  const focusDates = params.focusDates === '1';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || editId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const trip = await getTripById(db, editId);
        if (cancelled) return;
        if (!trip) {
          Alert.alert('Поездка не найдена');
          router.back();
          return;
        }
        setTitle(trip.title);
        setDescription(trip.description ?? '');
        setStartDate(trip.startDate);
        setEndDate(trip.endDate);
      } catch (e) {
        console.error(e);
        Alert.alert('Не удалось загрузить поездку');
        router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, editId, isEdit, router]);

  const onSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Нужно название', 'Укажите название поездки.');
      return;
    }

    const start = startDate;
    const end = endDate;
    if ((start && !end) || (!start && end)) {
      Alert.alert('Даты', 'Укажите обе даты (ДД.ММ.ГГ) или оставьте обе пустыми.');
      return;
    }
    if (start && end && start > end) {
      Alert.alert('Даты', 'Дата начала не может быть позже окончания.');
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
              'Дни скорректированы',
              `У ${cleared} мест сброшен день — он выходил за новую длительность поездки.`
            );
          }
        }
        router.replace({ pathname: '/trip/[id]', params: { id: String(editId) } });
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
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!isEdit || editId == null) return;
    Alert.alert(
      'Удалить поездку?',
      'Места останутся в общей базе. Маршрут и статусы посещений этой поездки будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTrip(db, editId);
                router.replace('/trips');
              } catch (e) {
                console.error(e);
                Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось удалить');
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
          {isEdit ? 'Редактирование' : 'Новая поездка'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>НАЗВАНИЕ</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Карелия, Выборг на выходные"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>ОПИСАНИЕ — НЕОБЯЗАТЕЛЬНО</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Кратко о поездке"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.area]}
          multiline
          textAlignVertical="top"
        />

        <DateField
          label="ДАТА НАЧАЛА"
          value={startDate}
          onChange={setStartDate}
          focused={focusDates}
          autoFocus={focusDates}
        />

        <DateField
          label="ДАТА ОКОНЧАНИЯ"
          value={endDate}
          onChange={setEndDate}
        />

        <Text style={styles.hint}>
          Вводите цифры — точки ДД.ММ.ГГ появятся сами. Или откройте календарь.
          Даты можно указать позже — для «Начать поездку» обе обязательны.
        </Text>

        <Pressable
          style={[styles.submit, saving && styles.submitDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          <Text style={styles.submitText}>
            {saving ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать поездку'}
          </Text>
        </Pressable>

        {isEdit ? (
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>Удалить поездку</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    borderColor: '#f0d4d0',
    backgroundColor: '#fdf6f5',
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    fontWeight: '800',
    color: '#b42318',
  },
});
