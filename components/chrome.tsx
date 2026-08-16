import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { FadeToBackground } from '@/components/FadeToBackground';
import { GlassView } from '@/components/GlassView';
import { IconPath } from '@/components/IconPath';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { artwork } from '@/constants/artwork';
import { radii, type AppColors } from '@/constants/theme';

type Props = {
  onPress?: () => void;
  variant?: 'solid' | 'glass';
};

export function SettingsButton({ onPress, variant = 'solid' }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const glass = variant === 'glass';
  const icon = (
    <IconPath
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4h.2A1.7 1.7 0 0 0 4.4 8L4.3 8a2 2 0 1 1 2.8-2.9l.1.1A1.7 1.7 0 0 0 10 4V3.7a2 2 0 1 1 4 0V4a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4Z"
      size={20}
      color={glass ? colors.onHeroText : colors.textStrong}
    />
  );
  if (glass) {
    return (
      <Pressable onPress={onPress} accessibilityLabel={t('common.settings')}>
        <GlassView style={styles.btnGlass}>{icon}</GlassView>
      </Pressable>
    );
  }
  return (
    <Pressable
      style={styles.btn}
      onPress={onPress}
      accessibilityLabel={t('common.settings')}
    >
      {icon}
    </Pressable>
  );
}

type BackButtonProps = {
  onPress?: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <Pressable style={styles.btn} onPress={onPress} accessibilityLabel={t('common.back')}>
      <IconPath d="M15 19l-7-7 7-7" size={19} color={colors.textStrong} strokeWidth={2} />
    </Pressable>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, styles.errorIcon]}>
        <IconPath
          d="M12 9v4M12 17h.01M10.3 4.7 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.7a2 2 0 0 0-3.4 0Z"
          size={26}
          color={colors.dangerText}
        />
      </View>
      <View style={[styles.emptyBody, styles.emptyBodyPlain]}>
        <Text style={styles.emptyTitle}>{title ?? t('alerts.loadErrorTitle')}</Text>
        <Text style={styles.emptySub}>{message || t('alerts.loadErrorSub')}</Text>
        {onRetry ? (
          <Pressable style={styles.emptyBtn} onPress={onRetry}>
            <Text style={styles.emptyBtnText}>{t('common.retry')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type EmptyStateProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  illustrated?: boolean;
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  illustrated = false,
}: EmptyStateProps) {
  const { colors, showArtwork } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const showHero = illustrated && showArtwork;
  return (
    <View style={styles.empty}>
      {showHero ? (
        <View style={styles.emptyHero} pointerEvents="none">
          <Image
            source={artwork.hero}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            accessible={false}
            importantForAccessibility="no"
          />
          <FadeToBackground height={76} />
        </View>
      ) : (
        <View style={styles.emptyIcon}>
          <IconPath
            d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 10.5a1.5 1.5 0 1 0 .01 0"
            size={26}
            color={colors.accent}
          />
        </View>
      )}
      <View style={[styles.emptyBody, !showHero && styles.emptyBodyPlain]}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{subtitle}</Text>
        {actionLabel ? (
          <Pressable style={styles.emptyBtn} onPress={onAction}>
            <Text style={styles.emptyBtnText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
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
    btnGlass: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.card,
      paddingBottom: 26,
      overflow: 'hidden',
      alignItems: 'center',
    },
    emptyHero: {
      width: '100%',
      height: 168,
    },
    emptyBody: {
      width: '100%',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 0,
      alignItems: 'center',
    },
    emptyBodyPlain: {
      paddingTop: 0,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: radii.xl,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 26,
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
    errorIcon: {
      backgroundColor: colors.dangerBg,
    },
  });
}
