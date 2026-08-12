import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { StubScreen } from '@/components/StubScreen';
import { colors, radii } from '@/constants/theme';

export default function FormIdeaScreen() {
  return (
    <StubScreen
      eyebrow="Новая идея"
      title="Куда хочу поехать"
      body="Форма-заготовка · запись в БД — этап 4."
    >
      <TextInput
        placeholder="Название направления"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        placeholder="Короткое описание"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.area]}
        multiline
      />
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
  area: {
    minHeight: 96,
    textAlignVertical: 'top',
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
