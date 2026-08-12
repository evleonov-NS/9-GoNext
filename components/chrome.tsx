import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { IconPath } from '@/components/IconPath';
import { colors, radii } from '@/constants/theme';

type Props = {
  onPress?: () => void;
};

export function SettingsButton({ onPress }: Props) {
  return (
    <Pressable style={styles.btn} onPress={onPress}>
      <IconPath
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4h.2A1.7 1.7 0 0 0 4.4 8L4.3 8a2 2 0 1 1 2.8-2.9l.1.1A1.7 1.7 0 0 0 10 4V3.7a2 2 0 1 1 4 0V4a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4Z"
        size={20}
        color={colors.textStrong}
      />
    </Pressable>
  );
}

type BackButtonProps = {
  onPress?: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable style={styles.btn} onPress={onPress}>
      <IconPath d="M15 19l-7-7 7-7" size={19} color={colors.textStrong} strokeWidth={2} />
    </Pressable>
  );
}

type EmptyStateProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <IconPath
          d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 10.5a1.5 1.5 0 1 0 .01 0"
          size={26}
          color={colors.accent}
        />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {actionLabel ? (
        <Pressable style={styles.emptyBtn} onPress={onAction}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    borderRadius: radii.card,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textOnAccent,
  },
});
