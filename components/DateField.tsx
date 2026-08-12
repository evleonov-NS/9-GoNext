import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '@/constants/theme';
import {
  dateFromIso,
  displayFromIso,
  isoFromDate,
  isoFromDisplay,
  maskDateDisplayInput,
} from '@/utils/tripDates';

type Props = {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
  focused?: boolean;
  autoFocus?: boolean;
};

/**
 * Дата поездки: ввод ДД.ММ.ГГ (цифровая клава) + кнопка календаря.
 * Наружу всегда ISO YYYY-MM-DD или null.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'ДД.ММ.ГГ',
  focused = false,
  autoFocus = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(() => displayFromIso(value));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState(() => dateFromIso(value));

  useEffect(() => {
    setText(displayFromIso(value));
    setDraft(dateFromIso(value));
  }, [value]);

  const applyText = (raw: string) => {
    const masked = maskDateDisplayInput(raw);
    setText(masked);
    if (!masked) {
      onChange(null);
      return;
    }
    const iso = isoFromDisplay(masked);
    if (iso) {
      onChange(iso);
      setDraft(dateFromIso(iso));
    }
  };

  const openPicker = () => {
    setDraft(dateFromIso(value));
    setPickerOpen(true);
  };

  const commitPicker = (date: Date) => {
    const iso = isoFromDate(date);
    onChange(iso);
    setText(displayFromIso(iso));
    setDraft(date);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerOpen(false);
      if (event.type === 'dismissed' || !selected) return;
      commitPicker(selected);
      return;
    }
    if (selected) setDraft(selected);
  };

  const closeIosPicker = (save: boolean) => {
    setPickerOpen(false);
    if (save) commitPicker(draft);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, focused && styles.labelFocus]}>{label}</Text>
      <View style={[styles.row, focused && styles.rowFocus]}>
        <TextInput
          value={text}
          onChangeText={applyText}
          onBlur={() => {
            if (!text) {
              onChange(null);
              return;
            }
            const iso = isoFromDisplay(text);
            if (iso) {
              onChange(iso);
              setText(displayFromIso(iso));
            } else {
              setText(displayFromIso(value));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="number-pad"
          inputMode="numeric"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={8}
        />
        <Pressable
          style={styles.calBtn}
          onPress={openPicker}
          accessibilityLabel="Открыть календарь"
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
      <Text style={styles.fieldHint}>Цифры — точки ДД.ММ.ГГ сами</Text>

      {pickerOpen && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          onChange={onPickerChange}
        />
      ) : null}

      {pickerOpen && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={() => closeIosPicker(false)}>
          <View style={styles.iosOverlay}>
            <Pressable style={styles.iosDismiss} onPress={() => closeIosPicker(false)} />
            <View style={[styles.iosSheet, { paddingBottom: 12 + insets.bottom }]}>
              <View style={styles.iosBar}>
                <Pressable onPress={() => closeIosPicker(false)} hitSlop={8}>
                  <Text style={styles.iosCancel}>Отмена</Text>
                </Pressable>
                <Text style={styles.iosTitle}>Дата</Text>
                <Pressable onPress={() => closeIosPicker(true)} hitSlop={8}>
                  <Text style={styles.iosDone}>Готово</Text>
                </Pressable>
              </View>
              <View style={styles.iosPickerWrap}>
                <DateTimePicker
                  value={draft}
                  mode="date"
                  display="inline"
                  themeVariant="light"
                  accentColor={colors.accent}
                  onChange={onPickerChange}
                  locale="ru-RU"
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {pickerOpen && Platform.OS === 'web' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={styles.webOverlay} onPress={() => setPickerOpen(false)}>
            <Pressable style={styles.webCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.iosTitle}>Выберите дату</Text>
              <Text style={styles.webHint}>
                На web введите дату в поле выше (ДД.ММ.ГГ) или укажите здесь:
              </Text>
              <TextInput
                value={value ?? ''}
                onChangeText={(v) => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                    onChange(v);
                    setText(displayFromIso(v));
                    setPickerOpen(false);
                  }
                }}
                placeholder="ГГГГ-ММ-ДД"
                placeholderTextColor={colors.textMuted}
                style={styles.webInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable style={styles.webClose} onPress={() => setPickerOpen(false)}>
                <Text style={styles.iosCancel}>Закрыть</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 8,
  },
  labelFocus: {
    color: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  rowFocus: {
    borderColor: colors.accent,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.text,
  },
  calBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldHint: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
  },
  iosOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  iosDismiss: {
    flex: 1,
  },
  iosSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: 12,
  },
  iosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  iosTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  iosCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  iosDone: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
  },
  iosPickerWrap: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iosPicker: {
    alignSelf: 'center',
    width: '100%',
    height: 340,
  },
  webOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  webCard: {
    backgroundColor: colors.bg,
    borderRadius: radii.xxl,
    padding: 18,
  },
  webHint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  webInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  webClose: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
