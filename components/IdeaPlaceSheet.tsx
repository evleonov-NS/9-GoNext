import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryIcon } from '@/components/CategoryIcon';
import { FilterChip } from '@/components/ui';
import { PLACE_CATEGORIES } from '@/constants/categories';
import { PLACE_PRIORITY_LIST } from '@/constants/priorities';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import type { IdeaPlaceRow } from '@/hooks/useTripIdea';
import type { PlacePriority } from '@/types';

type Props = {
  item: IdeaPlaceRow | null;
  visible: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onChangePriority: (priority: PlacePriority) => void;
  onSaveNotes: (notes: string | null) => void;
  onMove: (direction: 'up' | 'down') => void;
  onRemove: () => void;
  onOpenPlace: () => void;
};

export function IdeaPlaceSheet({
  item,
  visible,
  canMoveUp,
  canMoveDown,
  onClose,
  onChangePriority,
  onSaveNotes,
  onMove,
  onRemove,
  onOpenPlace,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(item?.notes ?? '');
  }, [item?.id, item?.notes]);

  if (!item) return null;
  const cat = PLACE_CATEGORIES[item.place.category];
  const meta = item.place.city
    ? `${cat.label} · ${item.place.city}`
    : cat.label;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.head}>
            <CategoryIcon category={item.place.category} size={44} />
            <View style={styles.headText}>
              <Text style={styles.name}>{item.place.name}</Text>
              <Text style={styles.meta}>{meta}</Text>
            </View>
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

          <View style={styles.row}>
            <Pressable
              style={[styles.secondary, !canMoveUp && styles.disabled]}
              disabled={!canMoveUp}
              onPress={() => onMove('up')}
            >
              <Text style={styles.secondaryText}>↑ Выше</Text>
            </Pressable>
            <Pressable
              style={[styles.secondary, !canMoveDown && styles.disabled]}
              disabled={!canMoveDown}
              onPress={() => onMove('down')}
            >
              <Text style={styles.secondaryText}>↓ Ниже</Text>
            </Pressable>
          </View>

          <Pressable style={styles.secondary} onPress={onOpenPlace}>
            <Text style={styles.secondaryText}>Открыть карточку места</Text>
          </Pressable>
          <Pressable style={styles.danger} onPress={onRemove}>
            <Text style={styles.dangerText}>Убрать из идеи</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.handle,
    alignSelf: 'center',
    marginBottom: 16,
  },
  head: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 18,
  },
  headText: {
    flex: 1,
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
  row: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 9,
  },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 9,
  },
  secondaryText: {
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
  },
  dangerText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.dangerText,
  },
  });
}
