import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { colors, radii } from '@/constants/theme';

type Props = {
  eyebrow: string;
  title: string;
  body?: string;
  children?: ReactNode;
};

export function StubScreen({ eyebrow, title, body, children }: Props) {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children}
      <Pressable style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Назад</Text>
      </Pressable>
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
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  title: {
    marginTop: 3,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  backLink: {
    marginTop: 24,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentMuted,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
});
