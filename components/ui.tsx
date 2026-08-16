import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function FilterChip({ label, active = false, onPress }: ChipProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.accent, borderColor: colors.accent }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.textOnAccent : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type PageTitleProps = {
  eyebrow: string;
  title: string;
  right?: ReactNode;
  tone?: 'default' | 'onHero';
};

export function PageTitle({ eyebrow, title, right, tone = 'default' }: PageTitleProps) {
  const { showArtwork } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const onHero = tone === 'onHero' && showArtwork;
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleText}>
        <Text style={[styles.eyebrow, onHero && styles.eyebrowOnHero]}>{eyebrow}</Text>
        <Text style={[styles.title, onHero && styles.titleOnHero]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    chip: {
      borderWidth: 1,
      borderRadius: radii.pill,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '800',
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 2,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: colors.text,
    },
    sectionAction: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 18,
    },
    titleText: {
      flex: 1,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    title: {
      marginTop: 6,
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -1.2,
      color: colors.text,
    },
    eyebrowOnHero: {
      color: colors.onHeroEyebrow,
    },
    titleOnHero: {
      color: colors.onHeroText,
    },
  });
}
