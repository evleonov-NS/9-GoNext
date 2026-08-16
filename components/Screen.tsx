import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import type { AppColors } from '@/constants/theme';
import { SCREEN_PAD_TOP, useHeroHeight } from '@/utils/heroLayout';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Отступ снизу под плавающий tab bar + FAB */
  tabBarPadding?: boolean;
  /** Hero-иллюстрация сверху, уезжает вместе со скроллом */
  hero?: boolean;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  tabBarPadding = false,
  hero = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const heroHeight = useHeroHeight();
  const { colors, showArtwork } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const bottomPad = tabBarPadding ? 110 + insets.bottom : 24 + insets.bottom;

  const heroLayer =
    hero && showArtwork ? <HeroBackdrop width={width} height={heroHeight} /> : null;

  const body = (
    <View
      style={[
        styles.inner,
        { paddingTop: SCREEN_PAD_TOP + insets.top, paddingBottom: bottomPad },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {heroLayer}
        {body}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {heroLayer}
      {body}
    </ScrollView>
  );
}

function createStyles(_colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    inner: {
      paddingHorizontal: 18,
      zIndex: 1,
    },
  });
}
