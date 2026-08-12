import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StubScreen } from '@/components/StubScreen';
import { PLACE_CATEGORY_LIST } from '@/constants/categories';
import { colors, radii } from '@/constants/theme';

export default function FormPlaceScreen() {
  return (
    <StubScreen
      eyebrow="Новое место"
      title="Что хочу посетить"
      body="Форма-заготовка · запись в БД — этап 3."
    >
      <TextInput
        placeholder="Название"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        placeholder="Город"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <Text style={styles.label}>Категория</Text>
      <View style={styles.cats}>
        {PLACE_CATEGORY_LIST.map((cat) => (
          <View key={cat.id} style={styles.cat}>
            <CategoryIcon category={cat.id} size={40} />
            <Text style={styles.catLabel}>{cat.shortLabel}</Text>
          </View>
        ))}
      </View>
      <View style={styles.submit}>
        <Text style={styles.submitText}>Сохранить</Text>
      </View>
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
  },
  label: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cat: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  submit: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitText: {
    fontWeight: '800',
    color: colors.textOnAccent,
  },
});
