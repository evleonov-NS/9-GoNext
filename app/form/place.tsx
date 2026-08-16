import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Snackbar, Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BackButton } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import {
  PLACE_CATEGORY_LIST,
  type PlaceCategoryId,
} from '@/constants/categories';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { createPlace, getPlaceById, updatePlace } from '@/repositories/placesRepository';
import type { PlaceInput } from '@/types';
import { formatCoords, parseCoord, parseCoordsPair } from '@/utils/coords';

export default function FormPlaceScreen() {
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
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PlaceCategoryId>('sight');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [visitLater, setVisitLater] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showPasteField, setShowPasteField] = useState(false);
  const [pasteDraft, setPasteDraft] = useState('');

  useEffect(() => {
    if (!isEdit || editId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const place = await getPlaceById(db, editId);
        if (cancelled) return;
        if (!place) {
          Alert.alert(t('alerts.placeNotFound'));
          router.back();
          return;
        }
        setName(place.name);
        setCity(place.city ?? '');
        setDescription(place.description ?? '');
        setCategory(place.category);
        setLat(place.latitude != null ? String(place.latitude) : '');
        setLng(place.longitude != null ? String(place.longitude) : '');
        setVisitLater(place.visitLater);
        setLiked(place.liked);
      } catch (e) {
        console.error(e);
        Alert.alert(t('alerts.loadPlaceFailed'));
        router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, editId, isEdit, router]);

  const buildInput = useCallback((): PlaceInput | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('alerts.needName'), t('alerts.needPlaceName'));
      return null;
    }
    const latitude = parseCoord(lat);
    const longitude = parseCoord(lng);
    if ((lat.trim() || lng.trim()) && (latitude == null || longitude == null)) {
      Alert.alert(t('alerts.coords'), t('alerts.coordsNumeric'));
      return null;
    }
    if (latitude != null && (latitude < -90 || latitude > 90)) {
      Alert.alert(t('alerts.coords'), t('alerts.coordsLat'));
      return null;
    }
    if (longitude != null && (longitude < -180 || longitude > 180)) {
      Alert.alert(t('alerts.coords'), t('alerts.coordsLng'));
      return null;
    }
    return {
      name: trimmed,
      city: city.trim() || null,
      description: description.trim() || null,
      category,
      latitude,
      longitude,
      visitLater,
      liked,
    };
  }, [name, city, description, category, lat, lng, visitLater, liked]);

  const onSave = async () => {
    const input = buildInput();
    if (!input) return;
    setSaving(true);
    try {
      if (isEdit && editId != null) {
        await updatePlace(db, editId, input);
        router.replace({ pathname: '/place/[id]', params: { id: String(editId) } });
      } else {
        const place = await createPlace(db, input);
        router.replace({ pathname: '/place/[id]', params: { id: String(place.id) } });
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('alerts.error'), e instanceof Error ? e.message : t('alerts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const applyPastedCoords = (raw: string): boolean => {
    const parsed = parseCoordsPair(raw);
    if (!parsed) return false;
    setLat(parsed.latitude.toFixed(6));
    setLng(parsed.longitude.toFixed(6));
    setShowPasteField(false);
    setPasteDraft('');
    setToast(t('toast.coordsPasted'));
    return true;
  };

  const openPasteFallback = () => {
    setPasteDraft('');
    setShowPasteField(true);
  };

  const onCopyCoords = async () => {
    const latitude = parseCoord(lat);
    const longitude = parseCoord(lng);
    if (latitude == null || longitude == null) {
      Alert.alert(t('alerts.noCoords'), t('alerts.noCoordsFirst'));
      return;
    }
    try {
      await Clipboard.setStringAsync(formatCoords(latitude, longitude));
      setToast(t('toast.coordsCopied'));
    } catch (e) {
      console.error(e);
      Alert.alert(t('alerts.copyFailedTitle'), t('alerts.copyFailedBody'));
    }
  };

  const onPasteCoords = async () => {
    if (Platform.OS === 'web') {
      openPasteFallback();
      return;
    }
    try {
      const raw = await Clipboard.getStringAsync();
      if (raw.trim()) {
        if (applyPastedCoords(raw)) return;
        Alert.alert(
          t('alerts.coordsUnrecognizedTitle'),
          t('alerts.coordsUnrecognizedBody')
        );
        return;
      }
      Alert.alert(t('alerts.clipboardEmptyTitle'), t('alerts.clipboardEmptyBody'));
    } catch (e) {
      console.error(e);
      openPasteFallback();
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
        <Text style={styles.title}>{isEdit ? t('form.edit') : t('form.newPlace')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('form.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('form.placeNamePh')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('form.city')}</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder={t('form.cityPh')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('form.descriptionOptional')}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('form.placeDescPh')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textarea]}
          multiline
          textAlignVertical="top"
        />

        <Text style={[styles.label, { marginBottom: 10 }]}>{t('form.category')}</Text>
        <View style={styles.cats}>
          {PLACE_CATEGORY_LIST.map((cat) => {
            const active = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.cat,
                  {
                    backgroundColor: active ? cat.bg : colors.surface,
                    borderColor: active ? cat.fg : colors.border,
                  },
                ]}
              >
                <CategoryIcon category={cat.id} size={40} />
                <Text style={[styles.catLabel, { color: active ? cat.fg : colors.textSecondary }]}>
                  {t(`categoryShort.${cat.id}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t('form.coordsOptional')}</Text>
        <View style={styles.coordsRow}>
          <TextInput
            value={lat}
            onChangeText={setLat}
            placeholder="62.267500"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.coordInput]}
            keyboardType="decimal-pad"
            autoCapitalize="none"
          />
          <TextInput
            value={lng}
            onChangeText={setLng}
            placeholder="33.980800"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.coordInput]}
            keyboardType="decimal-pad"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.coordActions}>
          <Pressable style={styles.secondaryBtn} onPress={() => void onPasteCoords()}>
            <Text style={styles.secondaryBtnText}>{t('form.pasteCoords')}</Text>
          </Pressable>
          {showPasteField ? (
            <TextInput
              autoFocus
              value={pasteDraft}
              onChangeText={(t) => {
                setPasteDraft(t);
                applyPastedCoords(t);
              }}
              placeholder={t('form.pasteCoordsPh')}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.pasteInput]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}
          <Pressable style={styles.secondaryBtn} onPress={() => void onCopyCoords()}>
            <Text style={styles.secondaryBtnText}>{t('form.copyCoordsNav')}</Text>
          </Pressable>
        </View>

        <View style={styles.flags}>
          <Pressable
            style={[styles.flag, visitLater && styles.flagActive]}
            onPress={() => setVisitLater((v) => !v)}
          >
            <Text style={[styles.flagText, visitLater && styles.flagTextActive]}>
              {t('form.visitLater')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.flag, liked && styles.flagActive]}
            onPress={() => setLiked((v) => !v)}
          >
            <Text style={[styles.flagText, liked && styles.flagTextActive]}>{t('form.liked')}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.submit, saving && styles.submitDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          <Text style={styles.submitText}>
            {saving ? t('common.saving') : t('form.savePlace')}
          </Text>
        </Pressable>
      </View>

      <Snackbar
        visible={toast != null}
        onDismiss={() => setToast(null)}
        duration={2200}
        style={styles.snack}
      >
        {toast}
      </Snackbar>
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
  textarea: {
    minHeight: 88,
    paddingTop: 14,
  },
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cat: {
    width: '23%',
    minWidth: 72,
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  catLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  coordActions: {
    gap: 8,
    marginBottom: 14,
  },
  pasteInput: {
    marginBottom: 0,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    fontWeight: '800',
    fontSize: 12.5,
    color: colors.textStrong,
  },
  flags: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 8,
  },
  flag: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  flagActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentMuted,
  },
  flagText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  flagTextActive: {
    color: colors.accent,
  },
  submit: {
    marginTop: 10,
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
  snack: {
    backgroundColor: colors.accentDark,
  },
  });
}
