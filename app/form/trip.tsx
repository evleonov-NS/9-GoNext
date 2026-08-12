import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { StubScreen } from '@/components/StubScreen';
import { colors, radii } from '@/constants/theme';

export default function FormTripScreen() {
  return (
    <StubScreen
      eyebrow="Новая поездка"
      title="Создать поездку"
      body="Форма-заготовка · запись в БД — этап 5."
    >
      <TextInput
        placeholder="Название"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        placeholder="Дата начала (ГГГГ-ММ-ДД)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        placeholder="Дата окончания"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <View style={styles.submit}>
        <Text style={styles.submitText}>Создать</Text>
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
  submit: {
    marginTop: 12,
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
