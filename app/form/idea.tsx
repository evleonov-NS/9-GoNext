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
import { Screen } from '@/components/Screen';
import { FilterChip } from '@/components/ui';
import { IDEA_STATUS_LIST } from '@/constants/priorities';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import {
  createTripIdea,
  deleteTripIdea,
  getTripIdeaById,
  updateTripIdea,
} from '@/repositories/tripIdeasRepository';
import type { TripIdeaStatus } from '@/types';

export default function FormIdeaScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEdit = editId != null && Number.isFinite(editId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TripIdeaStatus>('active');

  useEffect(() => {
    if (!isEdit || editId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const idea = await getTripIdeaById(db, editId);
        if (cancelled) return;
        if (!idea) {
          Alert.alert(t('alerts.ideaNotFound'));
          router.back();
          return;
        }
        setTitle(idea.title);
        setDescription(idea.description ?? '');
        setStatus(idea.status);
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
  }, [db, editId, isEdit, router]);

  const onSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert(t('alerts.needName'), t('alerts.needIdeaName'));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editId != null) {
        await updateTripIdea(db, editId, {
          title: trimmed,
          description: description.trim() || null,
          status,
        });
        router.replace({ pathname: '/idea/[id]', params: { id: String(editId) } });
      } else {
        const idea = await createTripIdea(db, {
          title: trimmed,
          description: description.trim() || null,
          status: 'active',
        });
        router.replace({ pathname: '/idea/[id]', params: { id: String(idea.id) } });
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
      t('alerts.deleteIdeaTitle'),
      t('alerts.deleteIdeaBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTripIdea(db, editId);
                router.replace('/want');
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
        <Text style={styles.title}>{isEdit ? t('form.edit') : t('form.newIdea')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('form.direction')}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('form.ideaTitlePh')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('form.noteOptional')}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('form.ideaDescPh')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.area]}
          multiline
          textAlignVertical="top"
        />

        {isEdit ? (
          <>
            <Text style={[styles.label, { marginBottom: 10 }]}>{t('form.status')}</Text>
            <View style={styles.chips}>
              {IDEA_STATUS_LIST.map((s) => (
                <FilterChip
                  key={s.id}
                  label={t(`ideaStatus.${s.id}`)}
                  active={status === s.id}
                  onPress={() => setStatus(s.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Pressable
          style={[styles.submit, saving && styles.submitDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          <Text style={styles.submitText}>
            {saving ? t('common.saving') : isEdit ? t('common.save') : t('form.saveIdea')}
          </Text>
        </Pressable>

        {isEdit ? (
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>{t('form.deleteIdea')}</Text>
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
    minHeight: 104,
    paddingTop: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
