import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PhotoGallery } from '@/components/PhotoGallery';
import { FilterChip } from '@/components/ui';
import { PLACE_CATEGORIES } from '@/constants/categories';
import { PLACE_PRIORITY_LIST } from '@/constants/priorities';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { usePhotos } from '@/hooks/usePhotos';
import type { TripPlaceRow } from '@/hooks/useTrip';
import type { PlacePriority, TripPlaceStatus } from '@/types';
import { tripPlaceStatusLabel } from '@/utils/tripLabels';

type Props = {
  item: TripPlaceRow | null;
  visible: boolean;
  dayOptions: number[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onChangeDay: (dayNumber: number | null) => void;
  onChangePriority: (priority: PlacePriority) => void;
  onSaveNotes: (notes: string | null) => void;
  onMove: (direction: 'up' | 'down') => void;
  onSetStatus: (status: TripPlaceStatus) => void;
  onRemove: () => void;
  onOpenPlace: () => void;
};

export function TripPlaceSheet({
  item,
  visible,
  dayOptions,
  canMoveUp,
  canMoveDown,
  onClose,
  onChangeDay,
  onChangePriority,
  onSaveNotes,
  onMove,
  onSetStatus,
  onRemove,
  onOpenPlace,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const tripPhotos = usePhotos({ tripPlaceId: item?.id ?? null });

  useEffect(() => {
    setNotes(item?.notes ?? '');
  }, [item?.id, item?.notes]);

  const statusHint = useMemo(
    () => (item ? tripPlaceStatusLabel(item.status) : ''),
    [item]
  );

  if (!item) return null;
  const cat = PLACE_CATEGORIES[item.place.category];
  const meta = item.place.city
    ? `${cat.label} · ${item.place.city}`
    : cat.label;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Тап по затемнению закрывает — sheet не перехватывает весь экран */}
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel="Закрыть" />

        <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.headRow}>
            <View style={styles.head}>
              <CategoryIcon category={item.place.category} size={44} />
              <View style={styles.headText}>
                <Text style={styles.name}>{item.place.name}</Text>
                <Text style={styles.meta}>
                  {meta} · {statusHint}
                </Text>
              </View>
            </View>
            <Pressable style={styles.closeChip} onPress={onClose} hitSlop={8}>
              <Text style={styles.closeChipText}>Закрыть</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.label}>День</Text>
            <View style={styles.chips}>
              <FilterChip
                label="Без дня"
                active={item.dayNumber == null}
                onPress={() => onChangeDay(null)}
              />
              {dayOptions.map((d) => (
                <FilterChip
                  key={d}
                  label={`День ${d}`}
                  active={item.dayNumber === d}
                  onPress={() => onChangeDay(d)}
                />
              ))}
            </View>

            <Text style={styles.label}>Приоритет</Text>
            <View style={styles.chips}>
              {PLACE_PRIORITY_LIST.map((p) => (
                <FilterChip
                  key={p.id}
                  label={p.label}
                  active={item.priority === p.id}
                  onPress={() => onChangePriority(p.id)}
                />
              ))}
            </View>

            <Text style={styles.label}>Заметка</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={() => {
                const next = notes.trim() || null;
                if (next !== (item.notes ?? null)) onSaveNotes(next);
              }}
              placeholder="Необязательно"
              placeholderTextColor={colors.textMuted}
              style={styles.notes}
              multiline
            />

            <Text style={styles.label}>Фотографии</Text>
            <View style={styles.photos}>
              <PhotoGallery
                photos={tripPhotos.photos}
                onAdd={(source) => {
                  void (async () => {
                    const link = { tripPlaceId: item.id, placeId: item.placeId };
                    setPhotoBusy(true);
                    try {
                      if (source === 'library') await tripPhotos.addFromLibrary(link);
                      else await tripPhotos.addFromCamera(link);
                    } catch (e) {
                      console.error(e);
                      Alert.alert(
                        'Фото',
                        e instanceof Error ? e.message : 'Не удалось добавить фото'
                      );
                    } finally {
                      setPhotoBusy(false);
                    }
                  })();
                }}
                onDelete={(photo) => {
                  void tripPhotos.remove(photo.id).catch((e) => {
                    console.error(e);
                    Alert.alert(
                      'Фото',
                      e instanceof Error ? e.message : 'Не удалось удалить фото'
                    );
                  });
                }}
                busy={photoBusy}
              />
            </View>

            <View style={styles.row}>
              <Pressable
                style={[styles.rowBtn, !canMoveUp && styles.disabled]}
                disabled={!canMoveUp}
                onPress={() => onMove('up')}
              >
                <Text style={styles.actionText}>↑ Выше</Text>
              </Pressable>
              <Pressable
                style={[styles.rowBtn, !canMoveDown && styles.disabled]}
                disabled={!canMoveDown}
                onPress={() => onMove('down')}
              >
                <Text style={styles.actionText}>↓ Ниже</Text>
              </Pressable>
            </View>

            {item.status !== 'visited' ? (
              <Pressable style={styles.primary} onPress={() => onSetStatus('visited')}>
                <Text style={styles.primaryText}>Посещено</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.action} onPress={() => onSetStatus('pending')}>
                <Text style={styles.actionText}>Вернуть в «не посещено»</Text>
              </Pressable>
            )}

            {item.status !== 'skipped' ? (
              <Pressable style={styles.action} onPress={() => onSetStatus('skipped')}>
                <Text style={styles.actionText}>Пропустить</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.action} onPress={() => onSetStatus('pending')}>
                <Text style={styles.actionText}>Отменить пропуск</Text>
              </Pressable>
            )}

            <Pressable style={styles.action} onPress={onOpenPlace}>
              <Text style={styles.actionText}>Открыть карточку места</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={onRemove}>
              <Text style={styles.dangerText}>Удалить из поездки</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 18,
    paddingTop: 14,
    maxHeight: '88%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.handle,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  head: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headText: {
    flex: 1,
  },
  closeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  notes: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 72,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  photos: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 9,
  },
  rowBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 9,
  },
  primaryText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.textOnAccent,
  },
  action: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 9,
  },
  actionText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  disabled: {
    opacity: 0.4,
  },
  danger: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  dangerText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.dangerText,
  },
  });
}
